const router = require("express").Router()
const { calcularFreteMelhorEnvio } = require("../services/melhorenvioService")

router.post("/calcularFrete", async (req, res) => {
    try {
        const { itens, cep_destino } = req.body;
        const opcoesFrete = await calcularFreteMelhorEnvio({ itens, cep_destino });
        return res.json(opcoesFrete);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

module.exports = router