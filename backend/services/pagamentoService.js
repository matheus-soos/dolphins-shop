const database = require("../config/database");
const Pagamento = require("../models/pagamento");
const Pedido_Venda = require("../models/pedido_venda");
const Cupom = require("../models/cupom");
const safrapayService = require("./safrapayService");

// Status do SafraPay que significam pagamento confirmado / cancelado
const STATUS_PAGO = ["Paid", "Approved", "Aprovado", "Captured"];
const STATUS_CANCELADO = ["Canceled", "Cancelled", "Denied", "Expired", "Refunded", "Voided", "NotAuthorized"];

function getTransacaoPrincipal(charge) {
    return charge?.transactions?.[0] || {};
}

/**
 * Atualiza Pagamento e Pedido_Venda a partir do retorno de /v2/charge/{id}.
 * É idempotente: pode ser chamado pelo webhook e pelo polling da tela
 * quantas vezes for necessário sem duplicar nada.
 *
 * Use { forcar: true } logo após criar o pagamento (o status inicial já
 * foi gravado, mas o pedido ainda não foi atualizado).
 *
 * Só promove o pedido para "Pago" se ele ainda estiver "Pendente" — assim
 * não sobrescreve pedidos já "Integrado" no Protheus.
 */
async function aplicarStatusCharge(pagamento, charge, { forcar = false } = {}) {
    const tx = getTransacaoPrincipal(charge);
    const novoStatus = tx.transactionStatus || charge?.chargeStatus || charge?.status;

    if (!novoStatus) return { pagamento, alterado: false };

    const pago = STATUS_PAGO.includes(novoStatus);
    const cancelado = STATUS_CANCELADO.includes(novoStatus);

    // Mesmo status de antes = já processado (pagamento e pedido são gravados juntos)
    if (pagamento.status === novoStatus && !forcar) {
        return { pagamento, alterado: false };
    }

    const transaction = await database.transaction();

    try {
        await pagamento.update({
            status: novoStatus,
            nsu: charge?.nsu || pagamento.nsu,
            is_capturado: pago ? true : pagamento.is_capturado,
            is_cancelado: cancelado ? true : pagamento.is_cancelado
        }, { transaction });

        if (pago) {
            await Pedido_Venda.update(
                { status: "Pago" },
                { where: { id: pagamento.pedido_venda_id, status: "Pendente" }, transaction }
            );
        } else if (cancelado) {
            // Pedido cancelado libera a reserva de estoque (ver estoqueService)
            // e devolve o uso do cupom
            const pedido = await Pedido_Venda.findOne({
                where: { id: pagamento.pedido_venda_id, status: "Pendente" },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (pedido) {
                await pedido.update({ status: "Cancelado" }, { transaction });

                if (pedido.cupom_id) {
                    const cupom = await Cupom.findByPk(pedido.cupom_id, { transaction, lock: transaction.LOCK.UPDATE });
                    if (cupom) {
                        await cupom.update({ quantidade_uso: String(Number(cupom.quantidade_uso) + 1) }, { transaction });
                    }
                }
            }
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    return { pagamento, alterado: true, pago, cancelado };
}

/**
 * Consulta a charge no SafraPay e sincroniza o status local
 */
async function sincronizarPagamentoPorCharge({ token, chargeId }) {
    const pagamento = await Pagamento.findOne({ where: { charge_id: String(chargeId) } });

    if (!pagamento) {
        return { encontrado: false };
    }

    const result = await safrapayService.consultarCharge({ token, chargeId });
    const charge = result?.charge || result;

    const sync = await aplicarStatusCharge(pagamento, charge);

    return { encontrado: true, charge: result, ...sync };
}

module.exports = {
    STATUS_PAGO,
    STATUS_CANCELADO,
    aplicarStatusCharge,
    sincronizarPagamentoPorCharge
};
