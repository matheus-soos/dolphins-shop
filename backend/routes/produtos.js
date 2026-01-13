const router = require("express").Router()
const fs = require('fs');
const Produto = require('../models/produto')
const multer = require("multer");
const path = require("path");
const Categoria = require("../models/categoria");
const Subcategoria = require("../models/subcategoria");
const { Op, Sequelize } = require("sequelize")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/productImages");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post("/novoProduto", upload.single("file"), async (req, res, next) => {
    try {
        const { nome, descricao, categoria_id, subcategoria_id, valor_custo, valor_venda, ncm, cfop, cest, peso, altura, largura, comprimento } = req.body

        const imagePath = req.file ? req.file.path : null;

        const produto = await Produto.create({
            nome,
            descricao,
            categoria_id,
            subcategoria_id,
            valor_custo,
            valor_venda,
            ncm,
            cfop,
            cest,
            peso,
            altura,
            largura,
            comprimento,
            saldo: 0,
            imgPath: imagePath
        })

        res.json({ success: true, produto })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getProdutos", async (req, res, next) => {
    try {
        const produtos = await Produto.findAll({
            include: [
                { model: Categoria, as: "Categoria" },
                { model: Subcategoria, as: "Subcategoria" }
            ],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, produtos })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getProdutosBySubcategoria/:subcategoria_id", async (req, res, next) => {
    try {

        const produtos = await Produto.findAll({
            where: {
                subcategoria_id: req.params.subcategoria_id
            },
            include: [
                { model: Categoria, as: "Categoria" },
                { model: Subcategoria, as: "Subcategoria" }
            ],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, produtos })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getProduto/:id", async (req, res, next) => {
    try {
        const produto = await Produto.findOne({
            where: { id: req.params.id },
            include: [
                { model: Categoria, as: "Categoria" },
                { model: Subcategoria, as: "Subcategoria" }
            ],
        })

        res.json({ success: true, produto })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/buscaProdutos", async (req, res, next) => {
    try {
        let text = req.query.t || "";

        text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const produtos = await Produto.findAll({
            where: Sequelize.where(
                Sequelize.fn('unaccent', Sequelize.col('nome')), {
                [Op.iLike]: `%${text}%`
            }),
            order: [['nome', 'ASC']]
        })

        res.json({ success: true, produtos })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getNCM", (req, res, next) => {

    fs.readFile("json/NCM.json", 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return;
        }

        const ncm = JSON.parse(data);

        res.json({ ncm })

    });

})

router.get("/getCFOP", (req, res, next) => {

    fs.readFile("json/CFOP.json", 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo JSON:', err);
            return;
        }

        const cfop = JSON.parse(data);

        res.json({ cfop })

    });

})

module.exports = router