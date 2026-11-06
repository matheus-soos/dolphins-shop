const Cupom = require("../models/cupom");

/**
 * Regras de validade do cupom (usadas na validação da tela e no checkout)
 * Retorna null se estiver válido, ou a mensagem de erro.
 */
function verificarCupom(cupom, hoje = new Date()) {
    if (!cupom) return "Cupom não encontrado";
    if (!cupom.ativo) return "Cupom inativo";

    if (cupom.data_inicio && new Date(cupom.data_inicio) > hoje) {
        return "Cupom ainda não está válido";
    }

    if (cupom.data_fim && new Date(cupom.data_fim) < hoje) {
        return "Cupom expirado";
    }

    // quantidade_uso é STRING no banco, por isso o Number()
    if (Number(cupom.quantidade_uso) <= 0) {
        return "Limite de uso do cupom atingido";
    }

    return null;
}

function arredondar(valor) {
    return Math.round((Number(valor) || 0) * 100) / 100;
}

/**
 * Calcula o desconto de UM cupom sobre o subtotal dos produtos (sem frete).
 * O campo "valor" é STRING no banco: antes era somado como texto
 * ("0" + "10" = "010"), o que gerava o cálculo errado.
 */
function calcularDescontoCupom(cupom, subtotal) {
    const valor = Number(String(cupom?.valor ?? "0").replace(",", "."));
    const base = Number(subtotal) || 0;

    if (!valor || valor < 0 || base <= 0) return 0;

    let desconto = 0;

    if (cupom.tipo === "percentual") {
        desconto = (base * Math.min(valor, 100)) / 100;
    } else if (cupom.tipo === "valor") {
        desconto = valor;
    }

    return arredondar(Math.min(desconto, base));
}

/**
 * Valida os cupons enviados pelo front no checkout.
 * Regra: apenas UM cupom por pedido (o pedido só tem cupom_id).
 */
async function validarCuponsCheckout(cupons_aplicados, subtotal, { transaction } = {}) {
    const ids = [...new Set((cupons_aplicados || [])
        .map(c => Number(typeof c === "object" ? c?.id : c))
        .filter(Boolean))];

    if (!ids.length) {
        return { cupom: null, desconto: 0 };
    }

    if (ids.length > 1) {
        throw { status: 400, message: "Apenas um cupom pode ser utilizado por pedido" };
    }

    const cupom = await Cupom.findByPk(ids[0], {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    const erro = verificarCupom(cupom);
    if (erro) {
        throw { status: 400, message: erro };
    }

    return {
        cupom,
        desconto: calcularDescontoCupom(cupom, subtotal)
    };
}

/**
 * Consome um uso do cupom (chamar dentro da transação do pedido)
 */
async function consumirCupom(cupom, { transaction } = {}) {
    if (!cupom) return;

    const restante = Math.max(0, Number(cupom.quantidade_uso) - 1);
    await cupom.update({ quantidade_uso: String(restante) }, { transaction });
}

module.exports = {
    verificarCupom,
    calcularDescontoCupom,
    validarCuponsCheckout,
    consumirCupom,
    arredondar
};
