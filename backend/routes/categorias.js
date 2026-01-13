const router = require("express").Router()
const Categoria = require('../models/categoria')
const Subcategoria = require('../models/subcategoria')
const slugify = require('slugify')

router.post("/create", async (req, res, next) => {
    try {
        const { nome } = req.body

        const categoria = await Categoria.create({
            nome: nome,
            slug: slugify(nome, { lower: true, strict: true })
        })

        res.json({ success: true, categoria })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.post("/createSubcategoria", async (req, res, next) => {
    try {
        const { nome, categoria_id } = req.body

        const subcategoria = await Subcategoria.create({
            nome,
            categoria_id,
            slug: slugify(nome, { lower: true, strict: true })
        })

        res.json({ success: true, subcategoria })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.get("/getCategorias", async (req, res, next) => {
    try {
        const categorias = await Categoria.findAll({
            include: [
                {
                    model: Subcategoria,
                    as: "Subcategorias",
                    order: [["id", "ASC"]]
                }
            ],
            order: [
                ["id", "ASC"],
                [{ model: Subcategoria, as: "Subcategorias" }, "id", "ASC"]
            ]
        })

        res.json({ success: true, categorias })
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.get("/getSubcategorias", async (req, res, next) => {
    try {
        const subcategorias = await Subcategoria.findAll()

        res.json({ success: true, subcategorias })
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.get("/getSubcategorias/:categoria_id", async (req, res, next) => {
    try {
        const subcategorias = await Subcategoria.findAll({
            where: { categoria_id: req.params.categoria_id }
        })

        res.json({ success: true, subcategorias })
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.get("/getCategoriaBySlug/:slug", async (req, res, next) => {
    try {
        const categoria = await Categoria.findOne({
            where: { slug: req.params.slug },
            include: [
                {
                    model: Subcategoria,
                    as: "Subcategorias",
                    order: [["id", "ASC"]]
                }
            ],
            order: [
                [{ model: Subcategoria, as: "Subcategorias" }, "id", "ASC"]
            ]
        })

        res.json({ success: true, categoria })
    } catch (error) {
        res.status(400).json({ error })
    }
})

router.get("/getSubcategoriaBySlug/:slug", async (req, res, next) => {
    try {
        const subcategoria = await Subcategoria.findOne({
            where: { slug: req.params.slug },
        })

        res.json({ success: true, subcategoria })
    } catch (error) {
        res.status(400).json({ error })
    }
})

module.exports = router