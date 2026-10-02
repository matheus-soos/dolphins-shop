const router = require("express").Router();
const axios = require("axios");
const dotenv = require("dotenv");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");
const Categoria = require("../models/categoria");
const Subcategoria = require("../models/subcategoria");
const Pagamento = require("../models/pagamento")
const Pedido_Venda = require("../models/pedido_venda");
const Pedido_Venda_Item = require("../models/pedido_venda_item")
const User = require("../models/user");

dotenv.config();
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");

router.post("/importarProdutos", async (req, res) => {
    importarProdutos();
    res.status(202).json({ message: "Importação iniciada" });
});

function limparTexto(valor) {
    if (!valor) return "";

    return valor.toString().trim().replace(/\s+/g, " ");
}

async function mapProduct(p) {
    let subcategoria;

    if (p.Categorias && p.Categorias?.length > 0) {
        subcategoria = await Subcategoria.findOne({
            where: { cod_categoria: p.Categorias[0]?.Codigo },
        });
    }

    const produto = {
        cod_produto: limparTexto(p.Codigo),
        nome: limparTexto(p.Descricao),
        descricao: limparTexto(p.Titulo || p.Descricao),
        valor_venda: Number(p.PrecoVenda) || 0,
        valor_custo: null,
        comprimento: Number(p.Comprimento) || 0,
        largura: Number(p.Largura) || 0,
        altura: Number(p.Profundidade) || 0,
        peso: Number(p.Cubagem) || 0,
        saldo: Number(p.SaldoDisponivel ?? p.SaldoEstoque) || 0,
        categoria_id: subcategoria?.categoria_id || null,
        subcategoria_id: subcategoria?.id || null,
        status: "Disponível",
    };

    if (
        !(
            produto.cod_produto &&
            produto.nome &&
            produto.descricao &&
            produto.status &&
            produto.valor_venda != null &&
            produto.peso != null &&
            produto.altura != null &&
            produto.largura != null &&
            produto.comprimento != null &&
            produto.saldo != null
        )
    ) {
        return null;
    }

    return produto;
}

async function importarProdutos() {
    const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService`;
    const authString = `${process.env.REST_USER}:${process.env.REST_PASS}`;
    const Authorization = "Basic " + Buffer.from(authString).toString("base64");
    const pageSize = 200;

    let page = 1;
    let totalPages = 1;

    do {
        try {
            const response = await axios.get(baseUrl, {
                params: {
                    Page: page,
                    PageSize: pageSize,
                },
                headers: {
                    Authorization,
                    "Content-Type": "application/json",
                    tenantId: "12,44",
                    Accept: "*/*",
                },
            });

            const { Produtos, TotalPages } = response.data;

            const produtos = await Promise.all(Produtos.map(mapProduct));
            const produtosFormat = produtos.filter((p) => p !== null);

            await Produto.bulkCreate(produtosFormat, {
                updateOnDuplicate: [
                    "nome",
                    "descricao",
                    "categoria_id",
                    "subcategoria_id",
                    "valor_venda",
                    "valor_custo",
                    "comprimento",
                    "largura",
                    "altura",
                    "peso",
                    "saldo",
                    "status",
                ],
            });

            console.log(Produtos.length, page);

            totalPages = TotalPages;
            page++;

            // Evita sobrecarregar o Protheus
            await new Promise((r) => setTimeout(r, 1000));
        } catch (error) {
            console.error(error);
            page++;
        }
    } while (page <= totalPages);

    console.log("Importação finalizada");
}

router.post("/sincronizarImagens", async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ erro: "IDs inválidos" });
        }

        const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/Image/`;
        const authString = `${process.env.REST_USER}:${process.env.REST_PASS}`;
        const Authorization =
            "Basic " + Buffer.from(authString).toString("base64");

        const produtos = await Produto.findAll({
            where: { id: ids },
            attributes: ["id", "cod_produto"],
        });

        if (!produtos.length) {
            return res.status(404).json({ erro: "Nenhum produto encontrado" });
        }

        const resultados = [];

        await Promise.all(
            produtos.map(async (p) => {
                try {
                    const response = await axios.get(baseUrl + p.cod_produto, {
                        headers: {
                            Authorization,
                            "Content-Type": "application/json",
                            tenantId: "12,44",
                            Accept: "*/*",
                        },
                    });

                    const produto = response.data?.Produtos[0];
                    const imagemBase64 = produto?.Imagem;

                    if (imagemBase64) {
                        const uploadDir = path.join(
                            __dirname,
                            "..",
                            "uploads",
                            "productImages",
                        );

                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }

                        const fileName = `${p.cod_produto}.png`;
                        const filePath = path.join(uploadDir, fileName);

                        await fs.promises.writeFile(
                            filePath,
                            imagemBase64,
                            "base64",
                        );

                        await Produto.update(
                            { imgPath: "uploads/productImages/" + fileName },
                            { where: { id: p.id } },
                        );

                        resultados.push({
                            id: p.id,
                            status: "sucesso",
                        });
                    } else {
                        resultados.push({
                            id: p.id,
                            status: "sem_imagem",
                        });
                    }
                } catch (error) {
                    console.error(error);
                    resultados.push({
                        id: p.id,
                        status: "erro",
                        erro: error.message,
                    });
                }
            }),
        );

        return res.json({
            message: "Sincronização finalizada",
            resultados,
        });
    } catch (error) {
        next(error);
    }
});

router.post("/importarClientes", async (req, res) => {
    importarClientes();
    res.status(202).json({ message: "Importação iniciada" });
});

async function importarClientes() {
    const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/Clientes`;
    const authString = `${process.env.PROTHEUS_USER}:${process.env.PROTHEUS_PASSWORD}`;
    const Authorization = "Basic " + Buffer.from(authString).toString("base64");
    const pageSize = 200;

    let page = 1;
    let totalPages = 1;

    do {
        const response = await axios.get(baseUrl, {
            params: {
                Page: page,
                PageSize: pageSize,
            },
            headers: {
                Authorization: Authorization,
                contentType: "application/json",
                tenantId: "12,44",
            },
        });

        const { Clientes, TotalPages } = response.data;

        for (const c of Clientes) {
            await Cliente.findOneAndUpdate(
                { cpfCnpj: c.cpfCnpj },
                {
                    nome: c.nome,
                    cpfCnpj: c.cpfCnpj,
                    inscricaoEstadual: c.inscricaoEstadual,
                    email: c.email,
                    telefone: c.ddd + c.telefone || c.dddcel + c.celular || "",
                    inscricaoEstadual: c.ie,
                    logradouro: c.logradouro,
                    numero: c.numero,
                    complemento: c.complemento,
                    referencia: c.referencia,
                    bairro: c.bairro,
                    cidade: c.cidade,
                    estado: c.estado,
                    cep: c.cep,
                },
                { upsert: true },
            );
        }

        console.log(Clientes.length, page);

        totalPages = TotalPages;
        page++;

        // Evita sobrecarregar o Protheus
        await new Promise((r) => setTimeout(r, 1000));
    } while (page <= totalPages);

    console.log("Importação finalizada");
}

router.post("/importarCategorias", async (req, res) => {
    try {
        const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/Categories`;
        const authString = `${process.env.REST_USER}:${process.env.REST_PASS}`;
        const Authorization =
            "Basic " + Buffer.from(authString).toString("base64");

        const response = await axios.get(baseUrl, {
            headers: {
                Authorization: Authorization,
                "Content-Type": "application/json",
                tenantId: "12,44",
                Accept: "*/*",
            },
        });

        const { Categorias } = response.data;

        for (const c of Categorias) {
            const subcategorias = c.Children || [];
            const nome = limparTexto(c.Descricao);
            const codCategoria = limparTexto(c.Codigo);

            const [categoria, created] = await Categoria.upsert(
                {
                    cod_categoria: codCategoria,
                    nome: nome,
                    slug: slugify(nome, { lower: true, strict: true }),
                    status: "Ativo",
                },
                {
                    returning: true,
                },
            );

            if (subcategorias.length > 0) {
                await Subcategoria.bulkCreate(
                    subcategorias.map((subc) => {
                        const nomeSub = limparTexto(subc.Descricao);
                        const codSub = limparTexto(subc.Codigo);

                        return {
                            cod_categoria: codSub,
                            categoria_id: categoria.id,
                            nome: nomeSub,
                            slug: slugify(nomeSub, {
                                lower: true,
                                strict: true,
                            }),
                            status: "Ativo",
                        };
                    }),
                    {
                        updateOnDuplicate: [
                            "categoria_id",
                            "nome",
                            "slug",
                            "status",
                        ],
                    },
                );
            }
        }

        res.status(202).json({ message: "Importação Finalizada" });
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
});

function normalizeText(text) {
    if (!text) return "";
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function mapPedidoToSalesOrder(pedido) {
    if (!pedido) {
        throw new Error("Pedido não encontrado no response.");
    }

    const formatDate = (date) =>
        new Date(date).toISOString().slice(0, 10).replace(/-/g, "");

    const getLogradouro = (logradouro = "", numero = "") => {
        logradouro = logradouro.trim();
        numero = (numero || "").trim();

        if (!numero) {
            return logradouro;
        }

        // Trata S/N
        if (numero.toUpperCase() === "S/N" && !logradouro.includes("S/N")) {
            return `${logradouro} S/N`;
        }

        // Verifica se o número já está no logradouro
        const regex = new RegExp(`\\b${numero}\\b`);

        if (regex.test(logradouro)) {
            return logradouro;
        }

        return `${logradouro} ${numero}`;
    };

    const cliente = pedido.Cliente || {};

    return {
        SalesOrder: {
            numeroPedido: `EC-${pedido.numero_pedido}`,
            dataPedido: formatDate(pedido.createdAt),
            valorTotal: Number(pedido.valor_total) || 0,
            percDesc: 0,
            frete: Number(pedido.frete) || 0,
            cliente: {
                nome: cliente.nome,
                cpfCnpj: cliente.cpf,
                email: cliente.User.email,
                telefone: cliente.telefone,
                logradouro: getLogradouro(
                    normalizeText(cliente.logradouro),
                    cliente.numero,
                ),
                complemento: normalizeText(cliente.complemento) || "",
                bairro: normalizeText(cliente.bairro),
                cidade: normalizeText(cliente.cidade),
                estado: normalizeText(cliente.estado),
                cep: cliente.cep,
                GrupoVenda: "000003",
            },

            entrega: {
                logradouro: getLogradouro(
                    normalizeText(cliente.logradouro),
                    cliente.numero,
                ),
                complemento: normalizeText(cliente.complemento) || "",
                bairro: normalizeText(cliente.bairro),
                cidade: normalizeText(cliente.cidade),
                estado: normalizeText(cliente.estado),
                cep: cliente.cep,
                contato: cliente.nome,
            },

            pagamentos: (pedido.Pagamentos || []).map((pagamento, index) => ({
                parcela: index + 1,
                formaPagamento:
                    pagamento.tipo_pagamento || pedido.forma_pagamento || "",
                cupomDesconto: "",
                bandeira: pagamento.bandeira || "",
                valor: Number(pagamento.valor) || 0,
                dataPagamento: formatDate(pagamento.data_transacao),
                numeroCartao: "",
                NSU: pagamento.nsu || "",
            })),

            itens: pedido.Pedido_Venda_Items.map((item, index) => ({
                sequencia: index + 1,
                codigoProduto: item.Produto.cod_produto,
                descricaoProduto: item.Produto.nome,
                quantidade: Number(item.quantidade) || 0,
                precoUnitario: Number(item.valor_unitario) || 0,
                valorTotal: Number(item.valor_total) || 0,
            })),
        },
    };
}

async function salesOrder() {
    const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/SalesOrder`;
    const authString = `${process.env.REST_USER}:${process.env.REST_PASS}`;
    const Authorization = "Basic " + Buffer.from(authString).toString("base64");

    // const trintaMin = new Date(Date.now() - 30 * 60 * 1000);

    const pedidos = await Pedido_Venda.findAll({
        include: [
            {
                model: Cliente,
                include: [{ model: User, as: "User", attributes: ["email"] }]
            },
            {
                model: Pedido_Venda_Item,
                include: [{ model: Produto, as: "Produto" }],
            },
            {
                model: Pagamento,
                attributes: [
                    "id",
                    "pedido_venda_id",
                    "charge_id",
                    "nsu",
                    "tipo_pagamento",
                    "valor",
                    "status",
                    "adquirente",
                    "token_pix",
                    "bandeira",
                    "autorizacao",
                    "parcelas",
                    "tipo_parcelamento",
                    "transaction_id",
                    "data_transacao",
                ],
            },
        ],
        where: {
            status: "Pago",
        },
    });

    if (!pedidos || pedidos.length === 0) {
        return;
    }

    for (const pedido of pedidos) {
        try {
            const result = mapPedidoToSalesOrder(pedido)

            const response = await axios.post(baseUrl, result, {
                headers: {
                    Authorization,
                    "Content-Type": "application/json",
                    tenantId: "12,44",
                    Accept: "*/*",
                },
            });

            if (response.status == 200) {
                pedido.status = "Integrado";
                await pedido.save();
                console.log(
                    "Pedido integrado Retaguarda: " + pedido.numero_pedido,
                );
            } else {
                console.log(response.status);
                console.log(response.data);
            }

            await new Promise((r) => setTimeout(r, 2000));
        } catch (error) {
            console.error(
                "Erro ao enviar pedido:",
                pedido.numero_pedido,
                error.message,
            );
        }
    }
}

//salesOrder()

module.exports = router;
