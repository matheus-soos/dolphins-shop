const Pagamento = require("../models/pagamento")

const router = require("express").Router()

router.post("/pagamentoCartao", (req, res, next) => {
    try {
        const { temporaryToken, amount } = req.body

        const endpoint_gateway = "https://payment.safrapay.com.br"

        const tokenTeste = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm5hbWVpZCI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm1lcmNoYW50SWQiOiJiNDRkMzU1MC1hYTI0LTRhZGUtYmNiMi1jNTlkOWY2Y2RhMzMiLCJtZXJjaGFudENvZGUiOiIxNDQ4MDY3IiwibmJmIjoxNzYzMDM1MDM0LCJleHAiOjE3NjQyNDQ2MzQsImlhdCI6MTc2MzAzNTAzNCwiaXNzIjoiU2FmcmFQYXkiLCJhdWQiOiJTYWZyYVBheSJ9.AUQUn73jJPZBAS5xdD6YNz6YXo3nRVDpM-pS9eHh0nwa_72-t_si6K4WhZdRXyMFga1WEzsonZnS5nSP7HAR0jNA8W8gEjjwezqDdVzrzYO_jF62LwrcBMx-ez-j2aQiCwRq2JsjiMcfeP4kALIOkrp8ICZ1uuwftEUp4q_Bkhf00wBy3Y30iSDx_z3HYy74OW_8F3TbauGrqnxn7CCPuyIc4dFkw6VLVtxW6kwmhGKtR9h29KBE4r5gLneoIawMpoNgpqoBt_H8ilH5atDZmLPkG9A-UUl5wrnHzIHpg-JuRuBIbIqEYTOmL3-dgAv_QjOgnYsXzZPd5CT4gMEW0A"
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + tokenTeste);
        headers.append("Content-Type", "application/json");

        const body = {
            charge: {
                customer: {
                    name: "Matheus",
                    email: "matheus.soos@plentech.com.br",
                    entityType: 1,
                    documentType: 1,
                    document: "44789814858",
                    gender: 2,
                    phone: {
                        countryCode: "55",
                        areaCode: "11",
                        number: "913462552",
                        type: 5
                    },
                    address: {
                        street: "Av. Pres. Juscelino Kubitschek",
                        number: "1327",
                        neighborhood: "Itaim Bibi",
                        city: "São Paulo",
                        state: "SP",
                        country: "BR",
                        zipCode: "04543-011",
                        complement: "4º andar"
                    }
                },
                transactions: [
                    {
                        temporaryCardToken: temporaryToken,
                        paymentType: 2,
                        amount: amount,
                        installmentNumber: 1,
                        acquirer: 7
                    }
                ],
                source: 8
            }
        }

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            redirect: 'follow'
        };

        fetch(endpoint_gateway + "/v2/charge/authorization", requestOptions)
            .then(response => response.json())
            .then(result => {
                Pagamento.create({
                    charge_id: result.charge.id,
                    nsu: result.charge.nsu,
                    tipo_pagamento: 'Credito',
                    valor: result.charge.transactions[0].amount,
                    status: result.charge.transactions[0].transactionStatus,
                    adquirente: result.charge.transactions[0].acquirer,
                    customer_id: result.charge.customerId,
                    qr_code: result.charge.transactions[0].qrCode,
                    qr_code_base64: result.charge.transactions[0].qrCodeBase64,
                    token_pix: result.charge.transactions[0].token,
                    transaction_id: result.charge.transactions[0].transactionId,
                    data_transacao: result.charge.transactions[0].creationDateTime
                })
                res.json(result)
            })
            .catch(error => console.log('error', error));
    } catch (error) {
        console.error(error)
    }
})

router.post("/pagamentoPix", (req, res, next) => {
    const { amount } = req.body

    const endpoint_gateway = "https://payment.safrapay.com.br"

    const tokenTeste = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm5hbWVpZCI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm1lcmNoYW50SWQiOiJiNDRkMzU1MC1hYTI0LTRhZGUtYmNiMi1jNTlkOWY2Y2RhMzMiLCJtZXJjaGFudENvZGUiOiIxNDQ4MDY3IiwibmJmIjoxNzYzMDM1MDM0LCJleHAiOjE3NjQyNDQ2MzQsImlhdCI6MTc2MzAzNTAzNCwiaXNzIjoiU2FmcmFQYXkiLCJhdWQiOiJTYWZyYVBheSJ9.AUQUn73jJPZBAS5xdD6YNz6YXo3nRVDpM-pS9eHh0nwa_72-t_si6K4WhZdRXyMFga1WEzsonZnS5nSP7HAR0jNA8W8gEjjwezqDdVzrzYO_jF62LwrcBMx-ez-j2aQiCwRq2JsjiMcfeP4kALIOkrp8ICZ1uuwftEUp4q_Bkhf00wBy3Y30iSDx_z3HYy74OW_8F3TbauGrqnxn7CCPuyIc4dFkw6VLVtxW6kwmhGKtR9h29KBE4r5gLneoIawMpoNgpqoBt_H8ilH5atDZmLPkG9A-UUl5wrnHzIHpg-JuRuBIbIqEYTOmL3-dgAv_QjOgnYsXzZPd5CT4gMEW0A"
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + tokenTeste);
    headers.append("Content-Type", "application/json");

    const body = {
        charge: {
            customer: {
                name: "Matheus",
                email: "matheus.soos@plentech.com.br",
                entityType: 1,
                documentType: 1,
                document: "44789814858",
                gender: 2,
                phone: {
                    countryCode: "55",
                    areaCode: "11",
                    number: "913462552",
                    type: 5
                },
                address: {
                    street: "Av. Pres. Juscelino Kubitschek",
                    number: "1327",
                    neighborhood: "Itaim Bibi",
                    city: "São Paulo",
                    state: "SP",
                    country: "BR",
                    zipCode: "04543-011",
                    complement: "4º andar"
                }
            },
            transactions: [
                {
                    amount: amount,
                },
            ],
            source: 8,
        },
    }

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        redirect: 'follow'
    };

    fetch(endpoint_gateway + "/v2/charge/pix", requestOptions)
        .then(response => response.json())
        .then(async result => {
            Pagamento.create({
                charge_id: result.charge.id,
                nsu: result.charge.nsu,
                tipo_pagamento: 'Pix',
                valor: result.charge.transactions[0].amount,
                status: result.charge.transactions[0].transactionStatus,
                adquirente: result.charge.transactions[0].acquirer,
                customer_id: result.charge.customerId,
                qr_code: result.charge.transactions[0].qrCode,
                qr_code_base64: result.charge.transactions[0].qrCodeBase64,
                token_pix: result.charge.transactions[0].token,
                transaction_id: result.charge.transactions[0].transactionId,
                data_transacao: result.charge.transactions[0].creationDateTime
            })
            res.json(result)
        })
        .catch(error => console.log('error', error));
})

router.get("/getPagamento/:chargeId", (req, res, next) => {

    const endpoint_gateway = "https://payment.safrapay.com.br"

    const tokenTeste = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm5hbWVpZCI6ImI0NGQzNTUwLWFhMjQtNGFkZS1iY2IyLWM1OWQ5ZjZjZGEzMyIsIm1lcmNoYW50SWQiOiJiNDRkMzU1MC1hYTI0LTRhZGUtYmNiMi1jNTlkOWY2Y2RhMzMiLCJtZXJjaGFudENvZGUiOiIxNDQ4MDY3IiwibmJmIjoxNzYzMDM1MDM0LCJleHAiOjE3NjQyNDQ2MzQsImlhdCI6MTc2MzAzNTAzNCwiaXNzIjoiU2FmcmFQYXkiLCJhdWQiOiJTYWZyYVBheSJ9.AUQUn73jJPZBAS5xdD6YNz6YXo3nRVDpM-pS9eHh0nwa_72-t_si6K4WhZdRXyMFga1WEzsonZnS5nSP7HAR0jNA8W8gEjjwezqDdVzrzYO_jF62LwrcBMx-ez-j2aQiCwRq2JsjiMcfeP4kALIOkrp8ICZ1uuwftEUp4q_Bkhf00wBy3Y30iSDx_z3HYy74OW_8F3TbauGrqnxn7CCPuyIc4dFkw6VLVtxW6kwmhGKtR9h29KBE4r5gLneoIawMpoNgpqoBt_H8ilH5atDZmLPkG9A-UUl5wrnHzIHpg-JuRuBIbIqEYTOmL3-dgAv_QjOgnYsXzZPd5CT4gMEW0A"
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + tokenTeste);
    headers.append("Content-Type", "application/json");

    const requestOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };

    fetch(endpoint_gateway + "/v2/charge/" + req.params.chargeId, requestOptions)
        .then(response => response.json())
        .then(async result => {
            const pagamento = await Pagamento.findOne({ where: { charge_id: req.params.chargeId } })
            result.pagamento = pagamento

            res.json(result)
        })
        .catch(error => console.log('error', error));

})

module.exports = router