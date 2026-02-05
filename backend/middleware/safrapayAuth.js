const SAFRAPAY_BASE_URL = "https://payment.safrapay.com.br";
const SAFRAPAY_MERCHANT_KEY = process.env.SAFRAPAY_MERCHANT_KEY;

let cachedToken = null;
let tokenExpiresAt = null;

module.exports = async function safrapayAuth(req, res, next) {
    try {
        // Se o token ainda for válido, reutiliza
        if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
            req.safrapayToken = cachedToken;
            return next();
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
            return res.status(401).json({
                message: "Erro ao autenticar no SafraPay",
                errors: result.errors
            });
        }

        cachedToken = result.accessToken;

        // Token do SafraPay normalmente expira em 1h
        tokenExpiresAt = Date.now() + (55 * 60 * 1000);

        req.safrapayToken = cachedToken;
        next();

    } catch (error) {
        console.error("Erro SafraPay Auth:", error);
        res.status(500).json({ message: "Erro ao autenticar no SafraPay" });
    }
};
