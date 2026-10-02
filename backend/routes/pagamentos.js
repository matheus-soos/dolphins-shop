const router = require("express").Router();
const Pagamento = require("../models/pagamento");

const safrapayAuth = require("../middleware/safrapayAuth");

router.get("/getPagamento/:pedidoId", safrapayAuth, async (req, res) => {
    try {
        const { pedidoId } = req.params;

        const pagamento = await Pagamento.findOne({ 
            where: { pedido_venda_id: pedidoId } 
        });

        if (!pagamento) {
            return res.status(404).json({ error: "Pagamento não encontrado." });
        }

        // Se for dinheiro ou não possuir transação em gateway
        if (pagamento.tipo_pagamento === 'Dinheiro' || !pagamento.charge_id) {
            return res.json({
                pagamento: pagamento,
                charge: {
                    status: pagamento.status,
                    transactions: [{
                        transactionStatus: 'Paid',
                        amount: pagamento.valor,
                        paymentMethod: 'dinheiro'
                    }]
                }
            });
        }

        const endpoint_gateway = "https://payment.safrapay.com.br";
        const headers = {
            "Authorization": `Bearer ${req.safrapayToken}`,
            "Content-Type": "application/json"
        };

        const response = await fetch(`${endpoint_gateway}/v2/charge/${pagamento.charge_id}`, {
            method: 'GET',
            headers: headers
        });

        const result = await response.json();
        result.pagamento = pagamento;

        return res.json(result);

    } catch (error) {
        console.error('Erro ao consultar pagamento:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

module.exports = router