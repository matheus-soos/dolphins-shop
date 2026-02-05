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

        res.json({ success: true, pedido })
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

module.exports = router
