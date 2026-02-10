const router = require("express").Router();
const axios = require("axios");
const dotenv = require("dotenv");
const Produto = require("../models/produto");
const Cliente = require("../models/cliente");
const Categoria = require("../models/categoria");
const Subcategoria = require("../models/subcategoria");
// const Municipio = require("../model/municipio");
dotenv.config();
const slugify = require("slugify");

router.post("/importarProdutos", async (req, res) => {
    importarProdutos();
    res.status(202).json({ message: "Importação iniciada" });
});

function limparTexto(valor) {
    if (!valor) return "";

    return valor
        .toString()
        .trim()
        .replace(/\s+/g, " ");
}

async function mapProduct(p) {
    let subcategoria

    if (p.Categorias && p.Categorias?.length > 0) {
        subcategoria = await Subcategoria.findOne({
            where: { cod_categoria: p.Categorias[0]?.Codigo }
        })
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

    if (!(produto.cod_produto &&
        produto.nome &&
        produto.descricao &&
        produto.status &&
        produto.valor_venda != null &&
        produto.peso != null &&
        produto.altura != null &&
        produto.largura != null &&
        produto.comprimento != null &&
        produto.saldo != null
    )) {
        return null;
    }

    return produto
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
                    "Accept": "*/*"
                },
            });

            const { Produtos, TotalPages } = response.data;

            const produtos = await Promise.all(Produtos.map(mapProduct));
            const produtosFormat = produtos.filter(p => p !== null);

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
                    "status"
                ]
            });

            console.log(Produtos.length, page);

            totalPages = TotalPages;
            page++;

            // Evita sobrecarregar o Protheus
            await new Promise((r) => setTimeout(r, 1000));
        } catch (error) {
            console.error(error)
            page++;
        }
    } while (page <= totalPages);

    console.log("Importação finalizada");
}


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
        const Authorization = "Basic " + Buffer.from(authString).toString("base64");

        const response = await axios.get(baseUrl, {
            headers: {
                "Authorization": Authorization,
                "Content-Type": "application/json",
                tenantId: "12,44",
                "Accept": "*/*"
            },
        });

        const { Categorias } = response.data;

        for (const c of Categorias) {
            const subcategorias = c.Children || [];
            const nome = limparTexto(c.Descricao);
            const codCategoria = limparTexto(c.Codigo);

            const [categoria, created] = await Categoria.upsert({
                cod_categoria: codCategoria,
                nome: nome,
                slug: slugify(nome, { lower: true, strict: true }),
                status: "Ativo"
            }, {
                returning: true
            });

            if (subcategorias.length > 0) {
                await Subcategoria.bulkCreate(subcategorias.map(subc => {
                    const nomeSub = limparTexto(subc.Descricao);
                    const codSub = limparTexto(subc.Codigo);

                    return {
                        cod_categoria: codSub,
                        categoria_id: categoria.id,
                        nome: nomeSub,
                        slug: slugify(nomeSub, { lower: true, strict: true }),
                        status: "Ativo"
                    };
                }), {
                    updateOnDuplicate: [
                        "categoria_id",
                        "nome",
                        "slug",
                        "status"
                    ]
                });
            }
        }

        res.status(202).json({ message: "Importação Finalizada" });
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
});

// router.post("/importarMunicipios", async (req, res) => {
//     importarMunicipiosProtheus();
//     res.status(202).json({ message: "Importação iniciada" });
// });

// async function importarMunicipiosProtheus() {
//     const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/Municipios`;
//     const authString = `${process.env.PROTHEUS_USER}:${process.env.PROTHEUS_PASSWORD}`;
//     const Authorization = "Basic " + Buffer.from(authString).toString("base64");

//     const pageSize = 200;

//     let page = 1;
//     let totalPages = 1;

//     do {
//         const response = await axios.get(baseUrl, {
//             params: {
//                 Page: page,
//                 PageSize: pageSize,
//             },
//             headers: {
//                 Authorization: Authorization,
//                 contentType: "application/json",
//                 tenantId: "03,03",
//             },
//         });

//         const { Municipios, TotalPages } = response.data;

//         for (const m of Municipios) {
//             await Municipio.findOneAndUpdate(
//                 {
//                     estado: m.Estado,
//                     municipio: m.Municipio
//                 },
//                 {
//                     estado: m.Estado,
//                     municipio: m.Municipio,
//                 },
//                 { upsert: true },
//             );
//         }

//         console.log(Municipios.length, page);

//         totalPages = TotalPages;
//         page++;

//         // Evita sobrecarregar o Protheus
//         await new Promise((r) => setTimeout(r, 1000));
//     } while (page <= totalPages);

//     console.log("Importação finalizada");
// }

function normalizeText(text) {
    if (!text) return ""
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
            numeroPedido: pedido.numeroPedido,
            dataPedido: formatDate(pedido.createdAt),
            valorTotal: Number(pedido.valor_total) || 0,
            percDesc: 0,
            frete: Number(pedido.frete) || 0,
            cliente: {
                nome: cliente.nome,
                cpfCnpj: cliente.cpf,
                email: cliente.email,
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
                GrupoVenda: "000003"
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
                contato: cliente.nome
            },

            pagamentos: (pedido.Pagamentos || []).map((pagamento, index) => ({
                parcela: index + 1,
                formaPagamento: pagamento.tipo_pagamento || pedido.forma_pagamento || "",
                cupomDesconto: "",
                bandeira: pagamento.bandeira || "",
                valor: Number(pagamento.valor) || 0,
                dataPagamento: formatDate(pagamento.data_transacao),
                numeroCartao: "",
                NSU: pagamento.nsu || ""
            })),

            itens: (pedido.Pedido_Venda_Items).map((item, index) => ({
                sequencia: index + 1,
                codigoProduto: item.Produto.cod_produto,
                descricaoProduto: item.Produto.nome,
                quantidade: Number(item.quantidade) || 0,
                precoUnitario: Number(item.valor_unitario) || 0,
                valorTotal: Number(item.valor_total) || 0
            }))
        }
    };
}


// async function salesOrder() {
//     const baseUrl = `${process.env.REST_URL}/api/Plenservice/v1/ProductService/SalesOrder/`;
//     const authString = `${process.env.PROTHEUS_USER}:${process.env.PROTHEUS_PASSWORD}`;
//     const Authorization = "Basic " + Buffer.from(authString).toString("base64");

//     const trintaMin = new Date(Date.now() - 30 * 60 * 1000);

//     const propostas = await Proposta.find({
//         statusRetaguarda: "Pendente",
//         createdAt: { $lte: trintaMin },
//     })
//         .populate("cliente")
//         .populate("vendedor");

//     if (!propostas || propostas.length === 0) {
//         return;
//     }

//     for (const proposta of propostas) {
//         try {
//             const result = {
//                 SalesOrder: {
//                     numeroPedido: "APF" + proposta.numeroProposta,
//                     dataPedido: formatDate(proposta.dataProposta),
//                     cpfVendedor: proposta.vendedor.cpfCnpj,
//                     valorTotal: proposta.valorTotal,
//                     percDesc: proposta.desconto || 0,
//                     frete: 0,
//                     tipoVenda: proposta.tipoVenda === "Balcão" ? "VB" : "VF",
//                     cliente: {
//                         nome: proposta.cliente.nome,
//                         cpfCnpj: proposta.cliente.cpfCnpj,
//                         email: proposta.cliente.email,
//                         telefone: proposta.cliente.telefone,
//                         ie: proposta.cliente.inscricaoEstadual,
//                         logradouro: getLogradouro(
//                             normalizeText(proposta.cliente.logradouro),
//                             proposta.cliente.numero,
//                         ),
//                         complemento: normalizeText(proposta.cliente.complemento) || "",
//                         referencia: normalizeText(proposta.cliente.referencia) || "",
//                         bairro: normalizeText(proposta.cliente.bairro),
//                         cidade: proposta.cliente.cidade,
//                         estado: proposta.cliente.estado,
//                         cep: proposta.cliente.cep,
//                         GrupoVenda: "000003",
//                     },

//                     entrega: {
//                         logradouro: getLogradouro(
//                             normalizeText(proposta.entrega.logradouro),
//                             proposta.entrega.numero,
//                         ),
//                         complemento: normalizeText(proposta.entrega.complemento) || "",
//                         referencia: normalizeText(proposta.entrega.referencia) || "",
//                         bairro: normalizeText(proposta.entrega.bairro),
//                         cidade: proposta.entrega.cidade,
//                         estado: proposta.entrega.estado,
//                         cep: proposta.entrega.cep,
//                         contato: proposta.cliente.nome,
//                     },

//                     pagamentos: proposta.pagamentos.map((pag) => ({
//                         parcela: pag.parcela,
//                         formaPagamento: pag.formaPagamento,
//                         cupomDesconto: "",
//                         bandeira: "",
//                         valor: pag.valor,
//                         dataPagamento: formatDate(proposta.dataProposta),
//                         numeroCartao: "",
//                         NSU: "",
//                     })),

//                     itens: proposta.itens.map((item) => ({
//                         sequencia: item.sequencia,
//                         codigoProduto: item.codigoProduto,
//                         descricaoProduto: item.descricaoProduto,
//                         quantidade: item.quantidade,
//                         precoUnitario: item.precoUnitario,
//                         valorTotal: item.valorTotal,
//                     })),
//                 },
//             };

//             const estados = {
//                 SP: "03,03",
//                 RS: "03,07",
//                 MG: "03,09",
//                 PR: "03,16",
//                 RJ: "03,17",
//             };

//             const tenantId = estados[proposta.cliente.estado] || "03,03";

//             const response = await axios.post(baseUrl, result, {
//                 headers: {
//                     Authorization,
//                     "Content-Type": "application/json",
//                     tenantId: tenantId,
//                 },
//             });

//             if (response.status == 200) {
//                 proposta.statusRetaguarda = "Integrado";
//                 await proposta.save();
//                 console.log(
//                     "Proposta integrada Retaguarda: " + proposta.numeroProposta,
//                 );
//             } else {
//                 console.log(response.status);
//                 console.log(response.data);
//             }

//             await new Promise((r) => setTimeout(r, 1000));
//         } catch (error) {
//             console.error(
//                 "Erro ao enviar proposta:",
//                 proposta.numeroProposta,
//                 error.message,
//             );
//         }
//     }
// }

module.exports = router