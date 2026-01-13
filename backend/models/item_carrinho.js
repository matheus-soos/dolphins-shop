const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Item_Carrinho = database.define("Item_Carrinho", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    carrinho_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false
    },
    produto_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false
    },
    quantidade: {
        type: DataTypes.DOUBLE,
        foreignKey: true,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Ativo",
        allowNull: false
    }
}, {
    tableName: "Itens_Carrinho"
});

module.exports = Item_Carrinho;