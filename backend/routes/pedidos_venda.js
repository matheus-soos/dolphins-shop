const router = require("express").Router()
const Pedido_Venda = require('../models/pedido_venda')

router.post("/novoPedido", async (req, res) => {
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

        const pedido = await Pedido_Venda.create({
            cliente_id,
            endereco_entrega_id,
            cupom_id,
            status: status || "Pendente",
            forma_pagamento,
            valor_total,
            desconto_total,
            frete
        })

        res.json({ success: true, pedido })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: error.message })
    }
})

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
        const pedido = await Pedido_Venda.findByPk(req.params.id)

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
