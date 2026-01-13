const Carrinho = require('../models/carrinho')
const Item_Carrinho = require('../models/item_carrinho')
const Produto = require('../models/produto')

const router = require('express').Router()

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

                    include: [{ model: Produto, as: "Produto" }]
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

router.post("/adicionarItem", async (req, res, next) => {
    const { carrinho_id, produto_id, quantidade = 1 } = req.body;

    try {
        const itemExistente = await Item_Carrinho.findOne({
            where: { carrinho_id, produto_id }
        });

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

                    include: [{ model: Produto, as: "Produto" }]
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
                    include: [{ model: Produto, as: "Produto" }]
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