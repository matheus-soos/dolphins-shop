const router = require("express").Router()
const Cliente = require("../models/cliente")
const Pagamento = require("../models/pagamento")
const Pedido_Venda = require('../models/pedido_venda')
const Pedido_Venda_Item = require("../models/pedido_venda_item")
const Produto = require("../models/produto")
const Cupom = require("../models/cupom")
const Produto_Imagem = require("../models/produto_imagem")
const auth = require("../middleware/auth")

router.get("/getPedidos", async (req, res) => {
    try {
        const pedidos = await Pedido_Venda.findAll({
            include: [{ model: Cliente, attributes: ["id", "nome"] }],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, pedidos })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

/* =========================================================
 * MEUS PEDIDOS (área do cliente logado)
 * Sempre filtra pelo cliente do token — o cliente nunca vê pedido de outro.
 * ========================================================= */

const ATRIBUTOS_PAGAMENTO_CLIENTE = [
    "id",
    "tipo_pagamento",
    "valor",
    "status",
    "bandeira",
    "parcelas",
    "data_transacao",
    "createdAt"
]

const includeItensPedido = {
    model: Pedido_Venda_Item,
    include: [{
        model: Produto,
        as: "Produto",
        attributes: ["id", "nome", "cod_produto"],
        include: [{
            model: Produto_Imagem,
            as: "ImagemPrincipal",
            attributes: ["id", "path"],
            required: false
        }]
    }]
}

async function getClienteLogado(req) {
    return Cliente.findOne({ where: { user_id: req.user.user_id } })
}

router.get("/meusPedidos", auth, async (req, res) => {
    try {
        const cliente = await getClienteLogado(req)

        if (!cliente) {
            return res.json({ success: true, pedidos: [] })
        }

        const pedidos = await Pedido_Venda.findAll({
            where: { cliente_id: cliente.id },
            include: [
                includeItensPedido,
                { model: Pagamento, attributes: ATRIBUTOS_PAGAMENTO_CLIENTE }
            ],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, pedidos })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: error.message })
    }
})

router.get("/meusPedidos/:id", auth, async (req, res) => {
    try {
        const cliente = await getClienteLogado(req)

        const pedido = cliente && await Pedido_Venda.findOne({
            where: { id: req.params.id, cliente_id: cliente.id },
            include: [
                includeItensPedido,
                { model: Pagamento, attributes: ATRIBUTOS_PAGAMENTO_CLIENTE }
            ]
        })

        if (!pedido) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const json = pedido.toJSON()

        if (pedido.cupom_id) {
            const cupom = await Cupom.findByPk(pedido.cupom_id, { attributes: ["codigo"] })
            json.cupom_codigo = cupom?.codigo
        }

        json.endereco = {
            logradouro: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            estado: cliente.estado,
            cep: cliente.cep
        }

        res.json({ success: true, pedido: json })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: error.message })
    }
})

router.get("/getPedido/:id", async (req, res) => {
    try {
        const pedido = await Pedido_Venda.findByPk(req.params.id, {
            include: [
                { model: Cliente },
                {
                    model: Pedido_Venda_Item,
                    include: [
                        { model: Produto, as: "Produto" }
                    ]
                },
                {
                    model: Pagamento,
                    attributes: [
                        "id",
                        "pedido_venda_id",
                        "charge_id",
                        "nsu",
                        "tipo_pagamento",
                        "valor",
                        "status",
                        "adquirente",
                        "token_pix",
                        "bandeira",
                        "autorizacao",
                        "parcelas",
                        "tipo_parcelamento",
                        "transaction_id",
                        "data_transacao",
                    ]
                }
            ]
        })

        if (!pedido) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const pedidoProtheus = mapPedidoToSalesOrder(pedido)

        res.json({ success: true, pedido, pedidoProtheus })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put("/updatePedido/:id", async (req, res) => {
    try {
        const {
            cliente_id,
            endereco_entrega_id,
            cupom_id,
            status,
            forma_pagamento,
            valor_total,
            desconto_total,
            frete
        } = req.body

        const [updated] = await Pedido_Venda.update({
            cliente_id,
            endereco_entrega_id,
            cupom_id,
            status,
            forma_pagamento,
            valor_total,
            desconto_total,
            frete
        }, {
            where: { id: req.params.id }
        })

        if (updated === 0) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado para atualização" })
        }

        res.json({ success: true, message: "Pedido atualizado com sucesso" })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete("/deletePedido/:id", async (req, res) => {
    try {
        const deleted = await Pedido_Venda.destroy({
            where: { id: req.params.id }
        })

        if (deleted === 0) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado para exclusão" })
        }

        res.json({ success: true, message: "Pedido deletado com sucesso" })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

function normalizeText(text) {
    if (!text) return ""
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function mapPedidoToSalesOrder(pedido) {
    if (!pedido) {
        throw new Error("Pedido não encontrado no response.");
    }

    const formatDate = (date) =>
        new Date(date).toISOString().slice(0, 10).replace(/-/g, "");

    const getLogradouro = (logradouro = "", numero = "") => {
        logradouro = logradouro.trim();
        numero = (numero || "").trim();

        if (!numero) {
            return logradouro;
        }

        // Trata S/N
        if (numero.toUpperCase() === "S/N" && !logradouro.includes("S/N")) {
            return `${logradouro} S/N`;
        }

        // Verifica se o número já está no logradouro
        const regex = new RegExp(`\\b${numero}\\b`);

        if (regex.test(logradouro)) {
            return logradouro;
        }

        return `${logradouro} ${numero}`;
    };

    const cliente = pedido.Cliente || {};

    return {
        SalesOrder: {
            numeroPedido: `EC-${pedido.numero_pedido}`,
            dataPedido: formatDate(pedido.createdAt),
            valorTotal: Number(pedido.valor_total) || 0,
            percDesc: 0,
            frete: Number(pedido.frete) || 0,
            cliente: {
                nome: cliente.nome,
                cpfCnpj: cliente.cpf,
                email: cliente.email,
                telefone: cliente.telefone,
                logradouro: getLogradouro(
                    normalizeText(cliente.logradouro),
                    cliente.numero,
                ),
                complemento: normalizeText(cliente.complemento) || "",
                bairro: normalizeText(cliente.bairro),
                cidade: normalizeText(cliente.cidade),
                estado: normalizeText(cliente.estado),
                cep: cliente.cep,
                GrupoVenda: "000003"
            },

            entrega: {
                logradouro: getLogradouro(
                    normalizeText(cliente.logradouro),
                    cliente.numero,
                ),
                complemento: normalizeText(cliente.complemento) || "",
                bairro: normalizeText(cliente.bairro),
                cidade: normalizeText(cliente.cidade),
                estado: normalizeText(cliente.estado),
                cep: cliente.cep,
                contato: cliente.nome
            },

            pagamentos: (pedido.Pagamentos || []).map((pagamento, index) => ({
                parcela: index + 1,
                formaPagamento: pagamento.tipo_pagamento || pedido.forma_pagamento || "",
                cupomDesconto: "",
                bandeira: pagamento.bandeira || "",
                valor: Number(pagamento.valor) || 0,
                dataPagamento: formatDate(pagamento.data_transacao),
                numeroCartao: "",
                NSU: pagamento.nsu || ""
            })),

            itens: (pedido.Pedido_Venda_Items).map((item, index) => ({
                sequencia: index + 1,
                codigoProduto: item.Produto.cod_produto,
                descricaoProduto: item.Produto.nome,
                quantidade: Number(item.quantidade) || 0,
                precoUnitario: Number(item.valor_unitario) || 0,
                valorTotal: Number(item.valor_total) || 0
            }))
        }
    };
}

module.exports = router
