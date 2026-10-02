import axios from "axios";

/**
 * Calcula o frete via API do Melhor Envio
 * @param {Object} params
 * @param {Array} params.itens - Lista de itens ({ produto/Produto, quantidade })
 * @param {string} params.cep_destino - CEP do destinatário
 * @returns {Promise<Array>} Lista de opções de frete disponíveis
 */
export async function calcularFreteMelhorEnvio({ itens, cep_destino }) {
  if (!itens || !itens.length || !cep_destino) {
    throw new Error("Itens e CEP de destino são obrigatórios.");
  }

  const cepDestino = cep_destino.toString().replace(/\D/g, "");

  let totalPeso = 0;
  let volumeTotal = 0;

  const products = itens.map((item) => {
    const produto = item.Produto || item.produto || item;
    const qtd = Number(item.quantidade) || 1;

    const altura = parseFloat(produto.altura) || 0;
    const largura = parseFloat(produto.largura) || 0;
    const comprimento = parseFloat(produto.comprimento) || 0;
    const peso = parseFloat(produto.peso) || 0;

    volumeTotal += comprimento * largura * altura * qtd;
    totalPeso += peso * qtd;

    return {
      id: produto.id || String(Math.random()),
      width: Math.max(largura, 11),
      height: Math.max(altura, 2),
      length: Math.max(comprimento, 16),
      weight: peso,
      insurance_value: parseFloat(produto.preco || produto.price || 0),
      quantity: qtd
    };
  });

  const lado = Math.cbrt(volumeTotal);
  const packageEstimado = {
    height: Math.max(lado, 2).toFixed(2),
    width: Math.max(lado, 11).toFixed(2),
    length: Math.max(lado, 16).toFixed(2),
    weight: totalPeso.toFixed(2)
  };

  const token = process.env.MELHORENVIO_TOKEN;

  const payload = {
    from: { postal_code: "05577200" },
    to: { postal_code: cepDestino },
    products: products
  };

  const options = {
    method: "POST",
    url: "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Aplicação Dolphins"
    },
    data: payload
  };

  try {
    const response = await axios.request(options);

    return response.data.filter((opcao) => !opcao.error);
  } catch (error) {
    console.error("Erro ao calcular frete no Melhor Envio:", error?.response?.data || error.message);
    throw new Error("Não foi possível calcular o frete.");
  }
}
