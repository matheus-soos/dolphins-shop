const router = require("express").Router();
const Pagamento = require("../models/pagamento");

const safrapayAuth = require("../middleware/safrapayAuth");
const { getSafrapayToken } = require("../middleware/safrapayAuth");
const { aplicarStatusCharge, sincronizarPagamentoPorCharge } = require("../services/pagamentoService");

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
        if (pagamento.tipo_pagamento === 'Dinheiro' || !pagamento.charge_id || pagamento.charge_id === '0') {
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

        // O polling da tela também atualiza o pedido (caso o webhook atrase/falhe)
        if (response.ok && result?.charge) {
            try {
                await aplicarStatusCharge(pagamento, result.charge);
            } catch (err) {
                console.error("Erro ao atualizar status do pagamento:", err);
            }
        }

        result.pagamento = pagamento;

        return res.json(result);

    } catch (error) {
        console.error('Erro ao consultar pagamento:', error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

/**
 * WEBHOOK SafraPay (PIX / cartão)
 *
 * URL para cadastrar no portal SafraPay:
 *   POST https://api.economicaonline.com.br/api/pagamentos/webhook/safrapay?token=SEU_TOKEN
 *
 * Por segurança NÃO confiamos no status que vem no corpo da notificação:
 * pegamos apenas o id da charge e consultamos o SafraPay (/v2/charge/{id}).
 * Se SAFRAPAY_WEBHOOK_TOKEN estiver no .env, o token da URL é obrigatório.
 */
function extrairChargeId(body = {}) {
    return body.ChargeId
        || body.chargeId
        || body.charge?.id
        || body.Charge?.Id
        || body.data?.chargeId
        || body.data?.charge?.id
        || body.id
        || null;
}

router.post("/webhook/safrapay", async (req, res) => {
    const tokenEsperado = process.env.SAFRAPAY_WEBHOOK_TOKEN;
    const tokenRecebido = req.query?.token || req.headers["x-webhook-token"];

    if (tokenEsperado && tokenRecebido !== tokenEsperado) {
        return res.status(401).json({ message: "Token inválido" });
    }

    const chargeId = extrairChargeId(req.body);

    console.log("Webhook SafraPay recebido:", JSON.stringify(req.body));

    if (!chargeId) {
        // Responde 200 para o SafraPay não ficar reenviando um payload que não entendemos
        return res.status(200).json({ received: true, message: "chargeId não encontrado no payload" });
    }

    try {
        const token = await getSafrapayToken();
        const resultado = await sincronizarPagamentoPorCharge({ token, chargeId });

        if (!resultado.encontrado) {
            return res.status(200).json({ received: true, message: "Pagamento não encontrado" });
        }

        return res.status(200).json({
            received: true,
            atualizado: resultado.alterado,
            status: resultado.pagamento?.status
        });
    } catch (error) {
        console.error("Erro ao processar webhook SafraPay:", error);
        // 500 faz o SafraPay tentar novamente mais tarde
        return res.status(500).json({ received: false });
    }
});

module.exports = router
