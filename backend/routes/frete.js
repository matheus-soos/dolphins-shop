const router = require("express").Router()
const axios = require('axios');

router.post("/calcularFrete", async (req, res) => {
    try {
        const { itens, cep_destino, cep_origem = "01002001" } = req.body;

        let totalPeso = 0;
        let volumeTotal = 0;

        itens.forEach(item => {
            const produto = item.Produto;

            const altura = parseFloat(produto.altura) || 0;
            const largura = parseFloat(produto.largura) || 0;
            const comprimento = parseFloat(produto.comprimento) || 0;
            const peso = parseFloat(produto.peso) || 0;

            const volume = comprimento * largura * altura * item.quantidade;
            volumeTotal += volume;
            totalPeso += peso * item.quantidade;
        });

        const lado = Math.cbrt(volumeTotal).toFixed(2);

        const pacote = {
            peso: totalPeso.toFixed(2),
            comprimento: Math.max(parseFloat(lado), 16).toFixed(2),
            largura: Math.max(parseFloat(lado), 11).toFixed(2),
            altura: Math.max(parseFloat(lado), 2).toFixed(2)
        };

        const token = process.env.MELHORENVIO_TOKEN;

        const options = {
            method: 'POST',
            url: 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': 'Aplicação matheus.soos@plentech.com.br'
            },
            data: {
                from: { postal_code: "05577200" },
                to: { postal_code: cep_destino.replace('-', '') },
                package: {
                    height: pacote.altura,
                    width: pacote.largura,
                    length: pacote.comprimento,
                    weight: pacote.peso
                }
            }
        };

        const response = await axios.request(options);
        res.json(response.data);

    } catch (err) {
        console.error(err?.response?.data || err.message);
        res.status(500).json({ error: "Erro ao calcular frete", detalhes: err?.response?.data || null });
    }
});

module.exports = router