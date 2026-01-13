const router = require("express").Router()
const axios = require('axios');

router.post("/calcularFrete", async (req, res) => {
    try {
        const { itens, cep_destino, cep_origem } = req.body;

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

        const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZDIwMjU4ODU2ZjJiMmQ3NzYxYjc5ZDJlYjY2MGU0OGMyOWUxYjQ4NDFiYjA2ZGE2MTI5MjVjMzZhM2Y0OGEyZmNkN2MwZDY0MjQyNGY1ZTAiLCJpYXQiOjE3NTE5MDk4ODguNDQ4NTUxLCJuYmYiOjE3NTE5MDk4ODguNDQ4NTUzLCJleHAiOjE3ODM0NDU4ODguNDMyNTk3LCJzdWIiOiI5ZjU1NzQzYi0xNmI4LTRhN2YtOTIwOC00OGQ0MDgwMDNkYzgiLCJzY29wZXMiOlsic2hpcHBpbmctY2FsY3VsYXRlIl19.4qUukynohNlGos7al2Gmz6dM1z3r3d2Cak0opvA4NbFTYmxeUURMNNowSsVtFAfzSbpNNkcSt10NrS6ZMbfExcWsaOlUs2x76wsOrgTeqZLmvTHBpzpdeZoMtI5QwFF71p7bPpq7oT8BzkvtUz3jV3fwwy82KILId_lx_zfN9cIgOXNpknNc4bZX-w5VJjPp6p8lZcJ56M6NZdsJ05y7BvkqyakcQsEwqBxODqJUtmyjNjEuE0rNssGU_nzmVuvNOXwwyoFag-Kpo7OVRvF7KiQcNipNng8KkwsntTx06eItBEPUPMB7hCMJflkmXg70se8ceMKco1cnJksFLtCtMHpDyaQqDNAZdc0GAJmrvJaoGMqLN4t0cFdthPGmOVz6m2e8LgKZ9GIe00QId-_5q-tq47SJCjDEalbniPQcpGSwmlOHU-wvn9Ba1-ONpb7g6r5UCevvaeN9lPXg48HwX4-D4wDCKizeCGbN6x_S2MpiVuYqboTn0oPsX0nwggLF6tZN6J9F57UOfoS3yxBjKZFDPjCzWTIPj4kXv2YMg-ShJ3YYApYRQ5354DbPHTpPmisULlQLvrMiypIWx1HSNwXEWO9cfoUsSmsKZGQmtkARlLHa9Gy6_YK3OXNCGbeBRAnvj__OYMmU9U9KH2c7ZF2GOqKvU3ZyrNLJoKhmYEY";

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