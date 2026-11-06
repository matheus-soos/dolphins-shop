const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Produto_Imagem = database.define("Produto_Imagem", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ordem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: "Produto_Imagens"
});

module.exports = Produto_Imagem;
