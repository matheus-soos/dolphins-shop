const Cupom = require('../models/cupom')

const router = require('express').Router()

router.post("/novoCupom", async (req, res, next) => {
    const { codigo, tipo, valor, quantidade_uso, data_inicio, data_fim } = req.body

    try {
        const cupom = await Cupom.create({
            codigo,
            tipo,
            valor,
            quantidade_uso,
            data_inicio,
            data_fim
        })

        res.json({ success: true, cupom })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.post("/validarCupom", async (req, res) => {
    const { codigo } = req.body

    try {
        const cupom = await Cupom.findOne({ where: { codigo } })

        if (!cupom) {
            return res.status(400).json({ success: false, message: "Cupom não encontrado" })
        }

        const today = new Date()

        if (!cupom.ativo) {
            return res.status(400).json({ success: false, message: "Cupom inativo" })
        }

        if (cupom.data_inicio && new Date(cupom.data_inicio) > today) {
            return res.status(400).json({ success: false, message: "Cupom ainda não está válido" })
        }

        if (cupom.data_fim && new Date(cupom.data_fim) < today) {
            return res.status(400).json({ success: false, message: "Cupom expirado" })
        }

        if (cupom.quantidade_uso <= 0) {
            return res.status(400).json({ success: false, message: "Limite de uso do cupom atingido" })
        }

        return res.json({ success: true, cupom })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: "Erro ao verificar o cupom", error })
    }
})

router.get("/getCupons", async (req, res) => {
    try {
        const cupons = await Cupom.findAll({
            order: [["createdAt", "DESC"]]
        })

        res.json({ success: true, cupons })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: "Erro ao buscar cupons", error })
    }
})

module.exports = router