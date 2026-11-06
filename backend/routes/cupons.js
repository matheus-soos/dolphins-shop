const Cupom = require('../models/cupom')
const { verificarCupom, calcularDescontoCupom } = require('../services/cupomService')

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
    const codigo = (req.body.codigo || "").trim()
    const { subtotal } = req.body

    if (!codigo) {
        return res.status(400).json({ success: false, message: "Informe o código do cupom" })
    }

    try {
        const cupom = await Cupom.findOne({ where: { codigo } })

        const erro = verificarCupom(cupom)

        if (erro) {
            return res.status(400).json({ success: false, message: erro })
        }

        // Se o front mandar o subtotal, já devolve o desconto calculado
        // com a mesma regra usada no checkout
        const desconto = subtotal != null ? calcularDescontoCupom(cupom, subtotal) : undefined

        return res.json({ success: true, cupom, desconto })
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