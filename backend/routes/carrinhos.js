const Carrinho = require('../models/carrinho')
const Item_Carrinho = require('../models/item_carrinho')
const Produto = require('../models/produto')
const Produto_Imagem = require('../models/produto_imagem')
const { getQuantidadesReservadas, calcularSaldoDisponivel } = require('../services/estoqueService')

const router = require('express').Router()

const includeImagemPrincipal = {
    model: Produto_Imagem,
    as: "ImagemPrincipal",
    attributes: ["id", "path"],
    required: false
}

router.post("/criarCarrinho", async (req, res, next) => {
    const { user_id } = req.body

    try {
        const carrinho = await Carrinho.create({
            user_id
        })

        const carrinhoAtualizado = await Carrinho.findByPk(carrinho.id, {
            include: [
                {
                    model: Item_Carrinho,
                    as: "Itens_Carrinho",

                    include: [{ model: Produto, as: "Produto", include: [includeImagemPrincipal] }]
                }
            ],
            order: [
                [{ model: Item_Carrinho, as: "Itens_Carrinho" }, "id", "ASC"]
            ]
        });

        res.json({ success: true, carrinho: carrinhoAtualizado })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getCarrinho/:id", async (req, res, next) => {
    try {
        const id = req.params.id

        const carrinho = await Carrinho.findByPk(id, {
            include: [
                {
                    model: Item_Carrinho,
                    as: "Itens_Carrinho",

                    include: [{ model: Produto, as: "Produto", include: [includeImagemPrincipal] }]
                }
            ],
            order: [
                [{ model: Item_Carrinho, as: "Itens_Carrinho" }, "id", "ASC"]
            ]
        });

        res.json(carrinho)
    } catch (error) {
        res.status(500).json(error)
    }
})

router.post("/adicionarItem", async (req, res, next) => {
    const { carrinho_id, produto_id } = req.body;
    const quantidade = Math.max(1, Math.floor(Number(req.body.quantidade) || 1));

    try {
        const itemExistente = await Item_Carrinho.findOne({
            where: { carrinho_id, produto_id }
        });

        // Valida saldo disponível (saldo - reservas de pedidos em aberto)
        const produto = await Produto.findByPk(produto_id);

        if (!produto) {
            return res.status(404).json({ error: "Produto não encontrado." });
        }

        const reservas = await getQuantidadesReservadas([produto.id]);
        const disponivel = calcularSaldoDisponivel(produto, reservas);
        const qtdNoCarrinho = Number(itemExistente?.quantidade || 0);

        if (qtdNoCarrinho + quantidade > disponivel) {
            return res.status(409).json({
                error: disponivel <= 0
                    ? "Produto sem estoque no momento."
                    : `Quantidade indisponível. Restam ${disponivel} unidade(s) em estoque.`,
                disponivel
            });
        }

        if (itemExistente) {
            itemExistente.quantidade += quantidade;
            await itemExistente.save();
        } else {
            await Item_Carrinho.create({
                carrinho_id,
                produto_id,
                quantidade
            });
        }

        const carrinhoAtualizado = await Carrinho.findByPk(carrinho_id, {
            include: [
                {
                    model: Item_Carrinho,
                    as: "Itens_Carrinho",

                    include: [{ model: Produto, as: "Produto", include: [includeImagemPrincipal] }]
                }
            ],
            order: [
                [{ model: Item_Carrinho, as: "Itens_Carrinho" }, "id", "ASC"]
            ]
        });

        return res.json({ carrinho: carrinhoAtualizado });
    } catch (error) {
        console.error("Erro ao adicionar item ao carrinho:", error);
        return res.status(500).json({ error: "Erro ao adicionar item ao carrinho." });
    }
})

router.post("/removerItem", async (req, res, next) => {
    const { carrinho_id, produto_id, quantidade = 1, destroy } = req.body;

    try {
        const itemExistente = await Item_Carrinho.findOne({
            where: { carrinho_id, produto_id }
        });

        if (itemExistente) {
            if (destroy || itemExistente.quantidade == 1) {
                await itemExistente.destroy()
            }
            else {
                itemExistente.quantidade -= quantidade;
                await itemExistente.save();
            }
        }

        const carrinhoAtualizado = await Carrinho.findByPk(carrinho_id, {
            include: [
                {
                    model: Item_Carrinho,
                    as: "Itens_Carrinho",
                    include: [{ model: Produto, as: "Produto", include: [includeImagemPrincipal] }]
                }
            ],
            order: [
                [{ model: Item_Carrinho, as: "Itens_Carrinho" }, "id", "ASC"]
            ]
        });

        return res.json({ carrinho: carrinhoAtualizado });
    } catch (error) {
        console.error("Erro ao adicionar item ao carrinho:", error);
        return res.status(500).json({ error: "Erro ao adicionar item ao carrinho." });
    }
})

module.exports = router