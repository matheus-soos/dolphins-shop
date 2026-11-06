const router = require("express").Router();
const database = require("../config/database");

const Pedido_Venda = require("../models/pedido_venda");
const Pedido_Venda_Item = require("../models/pedido_venda_item");
const Pagamento = require("../models/pagamento");
const Cliente = require("../models/cliente");
const Produto = require("../models/produto");

const safrapayAuth = require("../middleware/safrapayAuth");
const safrapayService = require("../services/safrapayService");
const { calcularFreteMelhorEnvio } = require("../services/melhorenvioService");
const { validarEstoqueItens } = require("../services/estoqueService");
const { validarCuponsCheckout, consumirCupom, arredondar } = require("../services/cupomService");
const { aplicarStatusCharge } = require("../services/pagamentoService");
const auth = require("../middleware/auth");

/**
 * Normaliza os itens vindos do front (agrupa produto repetido, valida quantidade)
 */
function normalizarItens(itens) {
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        throw { status: 400, message: "itens obrigatório" };
    }

    const agrupado = new Map();

    for (const item of itens) {
        const produto_id = Number(item.produto_id);
        const quantidade = Number(item.quantidade);

        if (!produto_id || !Number.isInteger(quantidade) || quantidade <= 0) {
            throw { status: 400, message: "Item inválido no carrinho" };
        }

        agrupado.set(produto_id, (agrupado.get(produto_id) || 0) + quantidade);
    }

    return [...agrupado].map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
}

/**
 * Função utilitária interna para validar produtos, recalcular frete no MelhorEnvio e o subtotal.
 * (Cupom e estoque são validados depois, dentro da transação, com lock.)
 */
async function processarTotaisCheckout({ itens, freteSelecionado, cep_destino }) {
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
    const subtotal = arredondar(itensReais.reduce((acc, item) => {
        return acc + (item.valor_unitario * item.quantidade);
    }, 0));

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

    return {
        itensReais,
        subtotal,
        freteFinal
    };
}

/**
 * Fluxo comum dos 3 meios de pagamento:
 * calcula totais, valida estoque + cupom com lock, cria pedido e itens,
 * consome o cupom e chama `pagar` para registrar o pagamento.
 */
async function criarPedidoCheckout(req, { forma_pagamento, status_inicial, pagar }) {
    const { freteSelecionado, cep_destino, cupons_aplicados } = req.body;

    const cliente = await Cliente.findOne({
        where: { user_id: req.user.user_id }
    });

    if (!cliente?.id) {
        throw { status: 400, message: "Cliente não encontrado" };
    }

    const itens = normalizarItens(req.body.itens);

    // Frete é calculado fora da transação (chamada externa)
    const { itensReais, subtotal, freteFinal } = await processarTotaisCheckout({
        itens,
        freteSelecionado,
        cep_destino
    });

    const transaction = await database.transaction();

    try {
        // Estoque e cupom validados com lock para evitar venda/uso em duplicidade
        await validarEstoqueItens(itensReais, { transaction });

        const { cupom, desconto } = await validarCuponsCheckout(cupons_aplicados, subtotal, { transaction });

        const total = arredondar(subtotal + freteFinal - desconto);

        // 1) Cria pedido
        const pedido = await Pedido_Venda.create({
            cliente_id: cliente.id,
            cupom_id: cupom?.id || null,
            status: status_inicial,
            forma_pagamento,
            valor_total: total,
            desconto_total: desconto,
            frete: freteFinal
        }, { transaction });

        // 2) Cria itens do pedido
        for (const item of itensReais) {
            await Pedido_Venda_Item.create({
                pedido_venda_id: pedido.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_total: arredondar(item.valor_unitario * item.quantidade)
            }, { transaction });
        }

        // 3) Consome um uso do cupom
        await consumirCupom(cupom, { transaction });

        // 4) Pagamento (específico de cada forma)
        const pagamento = await pagar({ pedido, total, transaction });

        await transaction.commit();

        return { pedido, pagamento };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

function tratarErroCheckout(res, error, mensagemPadrao) {
    console.error(error);

    if (error.status) {
        return res.status(error.status).json({
            message: error.message,
            indisponiveis: error.indisponiveis
        });
    }

    res.status(500).json({
        message: mensagemPadrao,
        error: error.message || error
    });
}

// FINALIZAR CHECKOUT PIX
router.post("/finalizar/pix", auth, safrapayAuth, async (req, res) => {
    try {
        const { pedido, pagamento } = await criarPedidoCheckout(req, {
            forma_pagamento: "Pix",
            status_inicial: "Pendente",
            pagar: async ({ pedido, total, transaction }) => {
                // Gera Pix no SafraPay
                const result = await safrapayService.gerarPix({
                    token: req.safrapayToken,
                    amount: total
                });

                const tx = result.charge.transactions[0];

                return Pagamento.create({
                    pedido_venda_id: pedido.id,
                    charge_id: result.charge.id,
                    nsu: result.charge.nsu,
                    tipo_pagamento: "Pix",
                    valor: tx.amount,
                    status: tx.transactionStatus,
                    adquirente: tx.acquirer,
                    customer_id: result.charge.customerId,
                    qr_code: tx.qrCode,
                    qr_code_base64: tx.qrCodeBase64,
                    token_pix: tx.token,
                    transaction_id: tx.transactionId,
                    data_transacao: tx.creationDateTime
                }, { transaction });
            }
        });

        res.json({
            success: true,
            pedido_id: pedido.id,
            pagamento_id: pagamento.id
        });
    } catch (error) {
        tratarErroCheckout(res, error, "Erro ao finalizar checkout Pix");
    }
});

// FINALIZAR CHECKOUT CARTÃO
router.post("/finalizar/cartao", auth, safrapayAuth, async (req, res) => {
    const { temporaryToken } = req.body;

    if (!temporaryToken) {
        return res.status(400).json({ message: "temporaryToken obrigatório" });
    }

    let chargeCartao = null;

    try {
        const { pedido, pagamento } = await criarPedidoCheckout(req, {
            forma_pagamento: "Credito",
            status_inicial: "Pendente",
            pagar: async ({ pedido, total, transaction }) => {
                // Autoriza pagamento no SafraPay
                const result = await safrapayService.autorizarCartao({
                    token: req.safrapayToken,
                    temporaryToken,
                    amount: total
                });

                if (!result?.charge?.id) {
                    throw { status: 400, message: "Erro ao autorizar pagamento no cartão" };
                }

                chargeCartao = result.charge;
                const tx = result.charge.transactions[0];

                return Pagamento.create({
                    pedido_venda_id: pedido.id,
                    charge_id: result.charge.id,
                    nsu: result.charge.nsu,
                    tipo_pagamento: "Credito",
                    valor: tx.amount,
                    status: tx.transactionStatus,
                    adquirente: tx.acquirer,
                    customer_id: result.charge.customerId,
                    transaction_id: tx.transactionId,
                    data_transacao: tx.creationDateTime
                }, { transaction });
            }
        });

        // Aprovado -> "Pago" / Negado -> "Cancelado" (libera estoque e cupom)
        const sync = await aplicarStatusCharge(pagamento, chargeCartao, { forcar: true });

        if (sync.cancelado) {
            return res.status(402).json({
                message: "Pagamento não autorizado. Verifique os dados do cartão ou tente outra forma de pagamento.",
                pedido_id: pedido.id
            });
        }

        res.json({
            success: true,
            pedido_id: pedido.id,
            pagamento_id: pagamento.id
        });
    } catch (error) {
        tratarErroCheckout(res, error, "Erro ao finalizar checkout no cartão");
    }
});

// FINALIZAR CHECKOUT DINHEIRO
router.post("/finalizar/dinheiro", auth, async (req, res) => {
    try {
        const { pedido, pagamento } = await criarPedidoCheckout(req, {
            forma_pagamento: "Dinheiro",
            status_inicial: "Pago",
            pagar: ({ pedido, total, transaction }) => Pagamento.create({
                pedido_venda_id: pedido.id,
                charge_id: 0,
                tipo_pagamento: "Dinheiro",
                valor: total,
                status: "Pago"
            }, { transaction })
        });

        res.json({
            success: true,
            pedido_id: pedido.id,
            pagamento_id: pagamento.id
        });
    } catch (error) {
        tratarErroCheckout(res, error, "Erro ao finalizar checkout em dinheiro");
    }
});

module.exports = router;
