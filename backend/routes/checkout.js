const router = require("express").Router();
const database = require("../config/database");

const Pedido_Venda = require("../models/pedido_venda");
const Pedido_Venda_Item = require("../models/pedido_venda_item");
const Pagamento = require("../models/pagamento");
const Cliente = require("../models/cliente");
const Produto = require("../models/produto")

const safrapayAuth = require("../middleware/safrapayAuth");
const safrapayService = require("../services/safrapayService");
const { calcularFreteMelhorEnvio } = require("../services/melhorenvioService");
const auth = require("../middleware/auth");

// FINALIZAR CHECKOUT PIX
router.post("/finalizar/pix", auth, safrapayAuth, async (req, res) => {
    const transaction = await database.transaction();

    try {
        const { itens, freteSelecionado, cep_destino, cupons_aplicados } = req.body;

        const cliente = await Cliente.findOne({
            where: { user_id: req.user.user_id }
        });

        if (!cliente?.id) {
            return res.status(400).json({ message: "Cliente não encontrado" });
        }

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ message: "itens obrigatório" });
        }

        if (!freteSelecionado?.id || !freteSelecionado?.companyId) {
            return res.status(400).json({ message: "freteSelecionado inválido" });
        }

        // 1) Buscar produtos no banco e montar itens reais
        const produtosIds = itens.map(i => i.produto_id);

        const produtos = await Produto.findAll({
            where: { id: produtosIds }
        });

        if (produtos.length !== produtosIds.length) {
            return res.status(400).json({ message: "Um ou mais produtos inválidos" });
        }

        const itensReais = itens.map(item => {
            const produto = produtos.find(p => p.id === item.produto_id);

            return {
                produto_id: produto.id,
                quantidade: item.quantidade,
                valor_unitario: Number(produto.valor_venda),

                peso: Number(produto.peso),
                altura: Number(produto.altura),
                largura: Number(produto.largura),
                comprimento: Number(produto.comprimento),
            };
        });
        // 2) Calcular subtotal real
        const subtotal = itensReais.reduce((acc, item) => {
            return acc + (item.valor_unitario * item.quantidade);
        }, 0);

        // 3) Recalcular frete real no MelhorEnvio (não confiar no front)
        const fretesCalculados = await calcularFreteMelhorEnvio({
            itens: itensReais,
            cep_destino
        });

        const freteReal = fretesCalculados.find(f =>
            f.id == freteSelecionado.id && f.company?.id == freteSelecionado.companyId
        );

        if (!freteReal) {
            return res.status(400).json({ message: "Frete selecionado inválido ou indisponível" });
        }

        const freteFinal = Number(freteReal.price);

        // 4) Validar cupons no backend e calcular desconto
        let descontoFinal = 0;

        if (cupons_aplicados?.length) {
            const cupons = await Cupom.findAll({
                where: { id: cupons_aplicados }
            });

            for (const cupom of cupons) {
                if (cupom.tipo === "percentual") {
                    descontoFinal += (subtotal * cupom.valor) / 100;
                } else if (cupom.tipo === "valor") {
                    descontoFinal += cupom.valor;
                }
            }

            descontoFinal = Math.min(descontoFinal, subtotal);
        }

        // 5) Total real final
        const total = subtotal + freteFinal - descontoFinal;

        // 6) cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id: cliente.id,
            status: "Pendente",
            forma_pagamento: "Pix",
            valor_total: total,
            desconto_total: descontoFinal,
            frete: freteFinal
        }, { transaction });

        // 7) cria itens do pedido
        for (const item of itensReais) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: item.valor_unitario * item.quantidade
            }, { transaction });
        }

        // 8) gera pix SafraPay
        const result = await safrapayService.gerarPix({
            token: req.safrapayToken,
            amount: total
        });

        // 9) salva pagamento
        await Pagamento.create({
            pedido_venda_id: pedido.id,
            charge_id: result.charge.id,
            nsu: result.charge.nsu,
            tipo_pagamento: "Pix",
            valor: result.charge.transactions[0].amount,
            status: result.charge.transactions[0].transactionStatus,
            adquirente: result.charge.transactions[0].acquirer,
            customer_id: result.charge.customerId,
            qr_code: result.charge.transactions[0].qrCode,
            qr_code_base64: result.charge.transactions[0].qrCodeBase64,
            token_pix: result.charge.transactions[0].token,
            transaction_id: result.charge.transactions[0].transactionId,
            data_transacao: result.charge.transactions[0].creationDateTime
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            pedido_id: pedido.id,
            charge: result.charge
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);

        res.status(500).json({
            message: "Erro ao finalizar checkout Pix",
            error
        });
    }
});

router.post("/finalizar/cartao", safrapayAuth, async (req, res) => {
    const transaction = await database.transaction();

    try {
        const { cliente_id, itens, frete, desconto_total, temporaryToken } = req.body;

        if (!temporaryToken) {
            return res.status(400).json({ message: "temporaryToken obrigatório" });
        }

        if (!cliente_id) {
            return res.status(400).json({ message: "cliente_id obrigatório" });
        }

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ message: "itens obrigatório" });
        }

        const freteFinal = frete || 0;
        const descontoFinal = desconto_total || 0;

        const subtotal = itens.reduce((acc, item) => {
            return acc + (item.valor_unitario * item.quantidade);
        }, 0);

        const total = subtotal + freteFinal - descontoFinal;

        // 1) cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id,
            status: "Pendente",
            forma_pagamento: "Credito",
            valor_total: total,
            desconto_total: descontoFinal,
            frete: freteFinal
        }, { transaction });

        // 2) cria itens do pedido
        for (const item of itens) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: item.valor_unitario * item.quantidade
            }, { transaction });
        }

        // 3) autoriza pagamento no SafraPay
        const result = await safrapayService.autorizarCartao({
            token: req.safrapayToken,
            temporaryToken,
            amount: total
        });

        if (!result?.charge?.id) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Erro ao autorizar pagamento no cartão",
                result
            });
        }

        // 4) salva pagamento
        const pagamentoCriado = await Pagamento.create({
            pedido_venda_id: pedido.id,
            charge_id: result.charge.id,
            nsu: result.charge.nsu,
            tipo_pagamento: "Credito",
            valor: result.charge.transactions[0].amount,
            status: result.charge.transactions[0].transactionStatus,
            adquirente: result.charge.transactions[0].acquirer,
            customer_id: result.charge.customerId,
            transaction_id: result.charge.transactions[0].transactionId,
            data_transacao: result.charge.transactions[0].creationDateTime
        }, { transaction });

        // 5) se aprovado já marca o pedido como pago
        const statusTransacao = result.charge.transactions[0].transactionStatus;

        if (statusTransacao === "Approved" || statusTransacao === "Aprovado") {
            await Pedido_Venda.update({
                status: "Pago"
            }, {
                where: { id: pedido.id },
                transaction
            });
        }

        await transaction.commit();

        res.json({
            success: true,
            pedido_id: pedido.id,
            pagamento_id: pagamentoCriado.id,
            charge: result.charge
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);

        res.status(500).json({
            message: "Erro ao finalizar checkout no cartão",
            error
        });
    }
});

module.exports = router