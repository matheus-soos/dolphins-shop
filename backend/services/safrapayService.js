const SAFRAPAY_BASE_URL = "https://payment.safrapay.com.br";

function getDefaultCustomer() {
    return {
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
    };
}

async function gerarPix({ token, amount }) {
    const body = {
        charge: {
            customer: getDefaultCustomer(),
            transactions: [
                {
                    //   amount: amount.toFixed(2)
                    amount: "100"
                }
            ],
            source: 8
        }
    };

    const response = await fetch(`${SAFRAPAY_BASE_URL}/v2/charge/pix`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw result;
    }

    return result;
}

async function autorizarCartao({ token, temporaryToken, amount }) {
    const body = {
        charge: {
            customer: getDefaultCustomer(),
            transactions: [
                {
                    temporaryCardToken: temporaryToken,
                    paymentType: 2,
                    amount: amount.toFixed(2),
                    installmentNumber: 1,
                    acquirer: 7
                }
            ],
            source: 8
        }
    };

    const response = await fetch(`${SAFRAPAY_BASE_URL}/v2/charge/authorization`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw result;
    }

    return result;
}

async function consultarCharge({ token, chargeId }) {
    const response = await fetch(`${SAFRAPAY_BASE_URL}/v2/charge/${chargeId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!response.ok) {
        throw result;
    }

    return result;
}

module.exports = {
    gerarPix,
    autorizarCartao,
    consultarCharge
};
