const router = require("express").Router()
const Cliente = require("../models/cliente")
const Pagamento = require("../models/pagamento")
const Pedido_Venda = require('../models/pedido_venda')
const Pedido_Venda_Item = require("../models/pedido_venda_item")
const Produto = require("../models/produto")

router.get("/getPedidos", async (req, res) => {
    try {
        const pedidos = await Pedido_Venda.findAll({
            order: [["id", "DESC"]]
        })

        res.json({ success: true, pedidos })
    } catch (error) {
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
