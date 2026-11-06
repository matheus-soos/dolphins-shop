const router = require("express").Router()
const fs = require('fs');
const Produto = require('../models/produto')
const multer = require("multer");
const path = require("path");
const Categoria = require("../models/categoria");
const Subcategoria = require("../models/subcategoria");
const { Op, Sequelize } = require("sequelize")
const Produto_Imagem = require("../models/produto_imagem");
const auth = require("../middleware/auth");
const database = require("../config/database");
const { anexarSaldoDisponivel } = require("../services/estoqueService");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "productImages");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Caminho salvo no banco sempre com "/" (no Windows o req.file.path vinha com "\\",
// o que quebrava a URL da imagem no front)
const toDbPath = (filename) => "uploads/productImages/" + filename;

// Imagem principal do produto (as imagens ficam só em Produto_Imagens)
const includeImagemPrincipal = {
    model: Produto_Imagem,
    as: "ImagemPrincipal",
    attributes: ["id", "path"],
    required: false
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas'));
        }
        cb(null, true);
    }
});

router.post("/novoProduto", upload.single("file"), async (req, res, next) => {
    try {
        const { nome, descricao, categoria_id, subcategoria_id, valor_custo, valor_venda, ncm, cfop, cest, peso, altura, largura, comprimento, saldo } = req.body

        const imagePath = req.file ? toDbPath(req.file.filename) : null;

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
            saldo: Number(saldo) || 0
        })

        if (imagePath) {
            await Produto_Imagem.create({
                produto_id: produto.id,
                path: imagePath,
                ordem: 0,
                principal: true
            })
        }

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
                { model: Subcategoria, as: "Subcategoria" },
                includeImagemPrincipal
            ],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, produtos: await anexarSaldoDisponivel(produtos) })
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
                { model: Subcategoria, as: "Subcategoria" },
                includeImagemPrincipal
            ],
            order: [["id", "DESC"]]
        })

        res.json({ success: true, produtos: await anexarSaldoDisponivel(produtos) })
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
                { model: Subcategoria, as: "Subcategoria" },
                { model: Produto_Imagem, as: "Imagens" }
            ],
            order: [
                [{ model: Produto_Imagem, as: "Imagens" }, "principal", "DESC"],
                [{ model: Produto_Imagem, as: "Imagens" }, "ordem", "ASC"],
                [{ model: Produto_Imagem, as: "Imagens" }, "id", "ASC"]
            ]
        })

        if (!produto) {
            return res.status(404).json({ success: false, message: "Produto não encontrado" })
        }

        res.json({ success: true, produto: await anexarSaldoDisponivel(produto) })
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
            include: [includeImagemPrincipal],
            order: [['nome', 'ASC']]
        })

        res.json({ success: true, produtos: await anexarSaldoDisponivel(produtos) })
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

router.get('/:id/relacionados', async (req, res) => {
    try {

        const { id } = req.params;

        const produto = await Produto.findByPk(id);

        if (!produto) {
            return res.status(404).json({ erro: "Produto não encontrado" });
        }

        // PRODUTOS RELACIONADOS (mesma subcategoria)
        const relacionados = await Produto.findAll({
            where: {
                id: { [Op.ne]: id },
                subcategoria_id: produto.subcategoria_id,
                status: 'Disponível'
            },
            include: [includeImagemPrincipal],
            limit: 6
        });

        // SUGESTÕES (mesma categoria)
        const sugestoes = await Produto.findAll({
            where: {
                id: { [Op.ne]: id },
                categoria_id: produto.categoria_id,
                status: 'Disponível'
            },
            include: [includeImagemPrincipal],
            order: Sequelize.literal('RANDOM()'),
            limit: 6
        });

        res.json({
            relacionados: await anexarSaldoDisponivel(relacionados),
            sugestoes: await anexarSaldoDisponivel(sugestoes)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

router.post('/sugestoes-carrinho', async (req, res) => {

  try {

    const { produtos } = req.body; // array de ids

    const itensCarrinho = await Produto.findAll({
      where: {
        id: produtos
      }
    });

    const categorias = [...new Set(itensCarrinho.map(p => p.categoria_id))];
    const subcategorias = [...new Set(itensCarrinho.map(p => p.subcategoria_id))];

    const sugestoes = await Produto.findAll({
      where: {
        id: { [Op.notIn]: produtos },
        [Op.or]: [
          { categoria_id: categorias },
          { subcategoria_id: subcategorias }
        ],
        status: 'Disponível'
      },
      include: [includeImagemPrincipal],
      order: Sequelize.literal('RANDOM()'),
      limit: 8
    });

    res.json(await anexarSaldoDisponivel(sugestoes));

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar sugestões' });

  }

});

/* =========================================================
 * IMAGENS DO PRODUTO (galeria)
 * Todas as imagens ficam em Produto_Imagens; sempre existe no máximo
 * uma "principal" por produto (usada nos cards, carrinho e pedidos).
 * ========================================================= */

async function listarImagens(produto_id, options = {}) {
    return Produto_Imagem.findAll({
        where: { produto_id },
        order: [["principal", "DESC"], ["ordem", "ASC"], ["id", "ASC"]],
        ...options
    })
}

/**
 * Garante que o produto tenha exatamente uma imagem principal
 * (se não tiver nenhuma, promove a primeira pela ordem)
 */
async function garantirPrincipal(produto_id, { transaction } = {}) {
    const imagens = await listarImagens(produto_id, { transaction })
    if (!imagens.length || imagens.some(i => i.principal)) return

    await imagens[0].update({ principal: true }, { transaction })
}

router.get("/:id/imagens", async (req, res) => {
    try {
        res.json({ success: true, imagens: await listarImagens(req.params.id) })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error })
    }
})

router.post("/:id/imagens", auth, upload.array("files", 10), async (req, res) => {
    try {
        const produto = await Produto.findByPk(req.params.id)

        if (!produto) {
            return res.status(404).json({ success: false, message: "Produto não encontrado" })
        }

        const arquivos = req.files || []

        if (!arquivos.length) {
            return res.status(400).json({ success: false, message: "Nenhuma imagem enviada" })
        }

        const existentes = await listarImagens(produto.id)
        let ordem = existentes.reduce((max, i) => Math.max(max, i.ordem), 0)

        for (const file of arquivos) {
            ordem++

            await Produto_Imagem.create({
                produto_id: produto.id,
                path: toDbPath(file.filename),
                ordem,
                principal: false
            })
        }

        // Produto sem imagem: a primeira enviada vira a principal
        await garantirPrincipal(produto.id)

        res.json({ success: true, imagens: await listarImagens(produto.id) })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: error.message || error })
    }
})

router.put("/imagens/:imagemId/principal", auth, async (req, res) => {
    const transaction = await database.transaction()

    try {
        const imagem = await Produto_Imagem.findByPk(req.params.imagemId, { transaction })

        if (!imagem) {
            await transaction.rollback()
            return res.status(404).json({ success: false, message: "Imagem não encontrada" })
        }

        await Produto_Imagem.update(
            { principal: false },
            { where: { produto_id: imagem.produto_id }, transaction }
        )
        await imagem.update({ principal: true }, { transaction })

        await transaction.commit()

        res.json({ success: true, imagens: await listarImagens(imagem.produto_id) })
    } catch (error) {
        await transaction.rollback()
        console.error(error)
        res.status(400).json({ error: error.message || error })
    }
})

router.delete("/imagens/:imagemId", auth, async (req, res) => {
    try {
        const imagem = await Produto_Imagem.findByPk(req.params.imagemId)

        if (!imagem) {
            return res.status(404).json({ success: false, message: "Imagem não encontrada" })
        }

        const produto_id = imagem.produto_id
        const caminho = imagem.path

        await imagem.destroy()

        // Remove o arquivo físico se nenhuma outra imagem usa o mesmo caminho
        const emUso = await Produto_Imagem.count({ where: { path: caminho } })
        if (!emUso) {
            const arquivo = path.join(__dirname, "..", caminho)
            fs.promises.unlink(arquivo).catch(() => { })
        }

        // Se era a principal, promove a próxima
        await garantirPrincipal(produto_id)

        res.json({ success: true, imagens: await listarImagens(produto_id) })
    } catch (error) {
        console.error(error)
        res.status(400).json({ error: error.message || error })
    }
})

module.exports = router
