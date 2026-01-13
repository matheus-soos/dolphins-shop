const Produto = require("../models/produto")

const router = require("express").Router()

router.post("/syncProdutos", (req, res, next) => {
    const url = "https://187.94.63.180:30248/rest/prodecomer?filial=44"
    const user = process.env.REST_USER
    const password = process.env.REST_PASS

    const headers = new Headers();
    headers.append("Authorization", "Basic " + btoa(`${user}:${password}`),)
    headers.append("Content-Type", "application/json");

    const requestOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(async (result) => {
            const produtos = result.produtos

            if (!produtos || produtos.length === 0) {
                res.send("Nenhum produto encontrado.")
                return;
            }

            const produtosInsert = produtos.map(produto => ({
                cod_produto: produto.Produto,
                nome: produto.Descricao,
                descricao: "",
                ncm: produto.NCM,
                valor_venda: parseFloat(produto.PrecoVenda),
                peso: parseFloat(produto.PesoEmbalagem),
                // estoque_min: parseFloat(produto.EstoqueSeg),
                cod_barras: produto.CodBarras,
                modelo: produto.Modelo,
                fabricante: produto.Fabricante,
                altura: parseFloat(produto.Altura),
                comprimento: parseFloat(produto.Comprimento),
                largura: parseFloat(produto.Largura),
            }))

            const campos = [
                "nome", "descricao", "ncm", "valor_venda", "peso",
                "cod_barras", "modelo", "fabricante", "altura", "comprimento", "largura"
            ]

            await Produto.bulkCreate(produtosInsert, {
                updateOnDuplicate: campos
            })

            res.send("Produtos inseridos ou atualizados com sucesso.")
        })
        .catch(error => {
            console.error('Erro ao processar produtos:', error)
            res.status(500).send("Erro ao processar produtos.")
        })
})

module.exports = router