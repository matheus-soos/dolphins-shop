async function defineModels() {

    const User = require('./user');
    const Produto = require('./produto');
    const Categoria = require('./categoria');
    const Subcategoria = require('./subcategoria');
    const Carrinho = require('./carrinho');
    const Item_Carrinho = require('./item_carrinho');
    const Cupom = require('./cupom')
    const Cliente = require('./cliente');
    const Pedido_Venda = require("./pedido_venda")
    const Pagamento = require("./pagamento")
    const Pedido_Venda_Item = require("./pedido_venda_item")

    // Subcategoria 1:n Produto
    Categoria.hasMany(Produto, {
        foreignKey: "categoria_id",
        as: "Produtos"
    })
    Produto.belongsTo(Categoria, {
        foreignKey: "categoria_id",
        as: "Categoria"
    })

    // Subcategoria 1:n Produto
    Subcategoria.hasMany(Produto, {
        foreignKey: "subcategoria_id",
        as: "Produtos"
    })
    Produto.belongsTo(Subcategoria, {
        foreignKey: "subcategoria_id",
        as: "Subcategoria"
    })

    // Categoria 1:n Subcategoria
    Categoria.hasMany(Subcategoria, {
        foreignKey: "categoria_id",
        as: "Subcategorias"
    })
    Subcategoria.belongsTo(Categoria, {
        foreignKey: "categoria_id",
        as: "Categoria"
    })

    // Carrinho 1:n Item_Carrinho
    Carrinho.hasMany(Item_Carrinho, {
        foreignKey: "carrinho_id",
        as: "Itens_Carrinho"
    })
    Item_Carrinho.belongsTo(Carrinho, {
        foreignKey: "carrinho_id",
        as: "Carrinho"
    })

    // Produto 1:n Item_Carrinho
    Produto.hasMany(Item_Carrinho, {
        foreignKey: 'produto_id',
        as: 'Item_Carrinhos'
    });
    Item_Carrinho.belongsTo(Produto, {
        foreignKey: 'produto_id',
        as: 'Produto'
    });

    // Carrinho 1:1 User
    User.hasOne(Carrinho, {
        foreignKey: "user_id",
        as: "Carrinho"
    });
    Carrinho.belongsTo(User, {
        foreignKey: "user_id",
        as: "User"
    });

    User.hasOne(Cliente, {
        foreignKey: 'user_id',
        as: 'Cliente'
    });
    Cliente.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'User'
    });

    // Pedido -> Itens
    Pedido_Venda.hasMany(Pedido_Venda_Item, { foreignKey: "pedido_venda_id" });
    Pedido_Venda_Item.belongsTo(Pedido_Venda, { foreignKey: "pedido_venda_id" });

    // Pedido -> Pagamentos
    Pedido_Venda.hasMany(Pagamento, { foreignKey: "pedido_venda_id" });
    Pagamento.belongsTo(Pedido_Venda, { foreignKey: "pedido_venda_id" });

    // Pedido_Venda_Item -> Produto
    Pedido_Venda_Item.belongsTo(Produto, {
        foreignKey: "produto_id",
        as: "Produto"
    });
    Produto.hasMany(Pedido_Venda_Item, {
        foreignKey: "produto_id",
        as: "ItensPedido"
    });

    Cliente.hasMany(Pedido_Venda, { foreignKey: "cliente_id" })
    Pedido_Venda.belongsTo(Cliente, { foreignKey: "cliente_id" })
}

module.exports = { defineModels };