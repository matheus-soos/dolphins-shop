const SAFRAPAY_BASE_URL = "https://payment.safrapay.com.br";
const SAFRAPAY_MERCHANT_KEY = process.env.SAFRAPAY_MERCHANT_KEY;

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Obtém (ou reaproveita do cache) o token do SafraPay.
 * Separado do middleware para poder ser usado fora de uma rota (ex.: webhook).
 */
async function getSafrapayToken() {
    // Se o token ainda for válido, reutiliza
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const response = await fetch(`${SAFRAPAY_BASE_URL}/v2/merchant/auth`, {
        method: "POST",
        headers: {
            "Authorization": SAFRAPAY_MERCHANT_KEY,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw { status: 401, message: "Erro ao autenticar no SafraPay", errors: result.errors };
    }

    cachedToken = result.accessToken;

    // Token do SafraPay normalmente expira em 1h
    tokenExpiresAt = Date.now() + (55 * 60 * 1000);

    return cachedToken;
}

const safrapayAuth = async (req, res, next) => {
    try {
        req.safrapayToken = await getSafrapayToken();
        next();
    } catch (error) {
        console.error("Erro SafraPay Auth:", error);

        if (error.status === 401) {
            return res.status(401).json({
                message: error.message,
                errors: error.errors
            });
        }

        res.status(500).json({ message: "Erro ao autenticar no SafraPay" });
    }
};

module.exports = safrapayAuth;
module.exports.getSafrapayToken = getSafrapayToken;
