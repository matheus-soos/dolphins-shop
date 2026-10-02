const router = require("express").Router();
const database = require("../config/database");

const Pedido_Venda = require("../models/pedido_venda");
const Pedido_Venda_Item = require("../models/pedido_venda_item");
const Pagamento = require("../models/pagamento");
const Cliente = require("../models/cliente");
const Produto = require("../models/produto");
const Cupom = require("../models/cupom");

const safrapayAuth = require("../middleware/safrapayAuth");
const safrapayService = require("../services/safrapayService");
const { calcularFreteMelhorEnvio } = require("../services/melhorenvioService");
const auth = require("../middleware/auth");

/**
 * Função utilitária interna para validar produtos, recalcular frete no MelhorEnvio e aplicar cupons
 */
async function processarTotaisCheckout({ itens, freteSelecionado, cep_destino, cupons_aplicados }) {
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        throw { status: 400, message: "itens obrigatório" };
    }

    if (!freteSelecionado?.id || !freteSelecionado?.companyId) {
        throw { status: 400, message: "freteSelecionado inválido" };
    }

    if (!cep_destino) {
        throw { status: 400, message: "cep_destino obrigatório" };
    }

    // 1) Buscar produtos no banco de dados
    const produtosIds = itens.map(i => i.produto_id);
    const produtos = await Produto.findAll({
        where: { id: produtosIds }
    });

    if (produtos.length !== produtosIds.length) {
        throw { status: 400, message: "Um ou mais produtos inválidos" };
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

    // 3) Recalcular frete real via MelhorEnvio (sem confiar no front)
    const fretesCalculados = await calcularFreteMelhorEnvio({
        itens: itensReais,
        cep_destino
    });

    const freteReal = fretesCalculados.find(f =>
        f.id == freteSelecionado.id && f.company?.id == freteSelecionado.companyId
    );

    if (!freteReal) {
        throw { status: 400, message: "Frete selecionado inválido ou indisponível" };
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

    return {
        itensReais,
        subtotal,
        freteFinal,
        descontoFinal,
        total
    };
}

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

        // Validação e cálculo seguro dos valores
        const { itensReais, freteFinal, descontoFinal, total } = await processarTotaisCheckout({
            itens,
            freteSelecionado,
            cep_destino,
            cupons_aplicados
        });

        // 1) Cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id: cliente.id,
            status: "Pendente",
            forma_pagamento: "Pix",
            valor_total: total,
            desconto_total: descontoFinal,
            frete: freteFinal
        }, { transaction });

        // 2) Cria itens do pedido
        for (const item of itensReais) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: item.valor_unitario * item.quantidade
            }, { transaction });
        }

        // 3) Gera Pix no SafraPay
        const result = await safrapayService.gerarPix({
            token: req.safrapayToken,
            amount: total
        });

        // 4) Salva pagamento
        const pagamentoCriado = await Pagamento.create({
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
            pagamento_id: pagamentoCriado.id
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);

        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }

        res.status(500).json({
            message: "Erro ao finalizar checkout Pix",
            error: error.message || error
        });
    }
});

// FINALIZAR CHECKOUT CARTÃO
router.post("/finalizar/cartao", auth, safrapayAuth, async (req, res) => {
    const transaction = await database.transaction();

    try {
        const { itens, freteSelecionado, cep_destino, cupons_aplicados, temporaryToken } = req.body;

        const cliente = await Cliente.findOne({
            where: { user_id: req.user.user_id }
        });

        if (!cliente?.id) {
            return res.status(400).json({ message: "Cliente não encontrado" });
        }

        if (!temporaryToken) {
            return res.status(400).json({ message: "temporaryToken obrigatório" });
        }

        // Validação e cálculo seguro dos valores
        const { itensReais, freteFinal, descontoFinal, total } = await processarTotaisCheckout({
            itens,
            freteSelecionado,
            cep_destino,
            cupons_aplicados
        });

        // 1) Cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id: cliente.id,
            status: "Pendente",
            forma_pagamento: "Credito",
            valor_total: total,
            desconto_total: descontoFinal,
            frete: freteFinal
        }, { transaction });

        // 2) Cria itens do pedido
        for (const item of itensReais) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: item.valor_unitario * item.quantidade
            }, { transaction });
        }

        // 3) Autoriza pagamento no SafraPay
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

        // 4) Salva pagamento
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

        // 5) Se aprovado já marca o pedido como pago
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
            pagamento_id: pagamentoCriado.id
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);

        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }

        res.status(500).json({
            message: "Erro ao finalizar checkout no cartão",
            error: error.message || error
        });
    }
});

// FINALIZAR CHECKOUT DINHEIRO
router.post("/finalizar/dinheiro", auth, async (req, res) => {
    const transaction = await database.transaction();

    try {
        const { itens, freteSelecionado, cep_destino, cupons_aplicados } = req.body;

        const cliente = await Cliente.findOne({
            where: { user_id: req.user.user_id }
        });

        if (!cliente?.id) {
            return res.status(400).json({ message: "Cliente não encontrado" });
        }

        // Validação e cálculo seguro dos valores
        const { itensReais, freteFinal, descontoFinal, total } = await processarTotaisCheckout({
            itens,
            freteSelecionado,
            cep_destino,
            cupons_aplicados
        });

        // 1) Cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id: cliente.id,
            status: "Pago",
            forma_pagamento: "Dinheiro",
            valor_total: total,
            desconto_total: descontoFinal,
            frete: freteFinal
        }, { transaction });

        // 2) Cria itens do pedido
        for (const item of itensReais) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: item.valor_unitario * item.quantidade
            }, { transaction });
        }

        // 3) Salva pagamento
        const pagamentoCriado = await Pagamento.create({
            pedido_venda_id: pedido.id,
            charge_id: 0,
            tipo_pagamento: "Dinheiro",
            valor: total,
            status: "Pago"
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            pedido_id: pedido.id,
            pagamento_id: pagamentoCriado.id
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);

        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }

        res.status(500).json({
            message: "Erro ao finalizar checkout em dinheiro",
            error: error.message || error
        });
    }
});

module.exports = router;