const router = require("express").Router();
const Pagamento = require("../models/pagamento");

const safrapayAuth = require("../middleware/safrapayAuth");

router.get("/getPagamento/:chargeId", safrapayAuth, (req, res, next) => {

    const endpoint_gateway = "https://payment.safrapay.com.br"

    const headers = {
        "Authorization": `Bearer ${req.safrapayToken}`,
        "Content-Type": "application/json"
    };

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