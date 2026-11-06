const { Op } = require("sequelize");
const Produto = require("../models/produto");
const Pedido_Venda = require("../models/pedido_venda");
const Pedido_Venda_Item = require("../models/pedido_venda_item");

/**
 * Status de pedido que "seguram" estoque.
 *
 * O saldo do produto vem do Protheus (importarProdutos). Enquanto o pedido
 * ainda não foi integrado na retaguarda, o Protheus não sabe dessa venda,
 * então descontamos aqui as quantidades reservadas pelos pedidos em aberto.
 * Depois que o pedido vira "Integrado", a próxima sincronização já traz o
 * saldo atualizado do ERP e a reserva deixa de ser contada.
 */
const STATUS_RESERVA = ["Pendente", "Pago"];

/**
 * Retorna um Map produto_id -> quantidade reservada em pedidos em aberto
 */
async function getQuantidadesReservadas(produtoIds, { transaction } = {}) {
    const ids = [...new Set((produtoIds || []).map(Number))].filter(Boolean);
    const reservas = new Map();

    if (!ids.length) return reservas;

    const itens = await Pedido_Venda_Item.findAll({
        attributes: ["produto_id", "quantidade"],
        where: { produto_id: { [Op.in]: ids } },
        include: [{
            model: Pedido_Venda,
            attributes: [],
            required: true,
            where: { status: { [Op.in]: STATUS_RESERVA } }
        }],
        transaction
    });

    for (const item of itens) {
        const atual = reservas.get(item.produto_id) || 0;
        reservas.set(item.produto_id, atual + Number(item.quantidade || 0));
    }

    return reservas;
}

/**
 * Calcula o saldo disponível para venda (saldo - reservas), nunca negativo
 */
function calcularSaldoDisponivel(produto, reservas) {
    const saldo = Number(produto?.saldo || 0);
    const reservado = reservas?.get(produto?.id) || 0;
    return Math.max(0, saldo - reservado);
}

/**
 * Acrescenta o campo saldo_disponivel em uma lista de produtos (instâncias ou JSON)
 */
async function anexarSaldoDisponivel(produtos) {
    const lista = (Array.isArray(produtos) ? produtos : [produtos]).filter(Boolean);
    if (!lista.length) return Array.isArray(produtos) ? [] : null;

    const reservas = await getQuantidadesReservadas(lista.map(p => p.id));

    const resultado = lista.map(p => {
        const json = typeof p.toJSON === "function" ? p.toJSON() : { ...p };
        json.saldo_disponivel = calcularSaldoDisponivel(json, reservas);
        return json;
    });

    return Array.isArray(produtos) ? resultado : resultado[0];
}

/**
 * Valida se há saldo para todos os itens. Lança { status: 409 } se faltar.
 * Usa lock nas linhas de produto quando chamado dentro de uma transação,
 * evitando que dois checkouts simultâneos vendam a mesma última unidade.
 */
async function validarEstoqueItens(itens, { transaction } = {}) {
    const ids = itens.map(i => Number(i.produto_id));

    const produtos = await Produto.findAll({
        where: { id: ids },
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    const reservas = await getQuantidadesReservadas(ids, { transaction });
    const indisponiveis = [];

    // Soma quantidades do mesmo produto (caso venha repetido)
    const qtdPorProduto = new Map();
    for (const item of itens) {
        const id = Number(item.produto_id);
        qtdPorProduto.set(id, (qtdPorProduto.get(id) || 0) + Number(item.quantidade || 0));
    }

    for (const [produtoId, quantidade] of qtdPorProduto) {
        const produto = produtos.find(p => p.id === produtoId);
        const disponivel = calcularSaldoDisponivel(produto, reservas);

        if (!produto || quantidade > disponivel) {
            indisponiveis.push({
                produto_id: produtoId,
                nome: produto?.nome,
                solicitado: quantidade,
                disponivel
            });
        }
    }

    if (indisponiveis.length) {
        const nomes = indisponiveis
            .map(i => `${i.nome || "Produto " + i.produto_id} (disponível: ${i.disponivel})`)
            .join(", ");

        throw {
            status: 409,
            message: `Estoque insuficiente para: ${nomes}`,
            indisponiveis
        };
    }

    return produtos;
}

module.exports = {
    STATUS_RESERVA,
    getQuantidadesReservadas,
    calcularSaldoDisponivel,
    anexarSaldoDisponivel,
    validarEstoqueItens
};
