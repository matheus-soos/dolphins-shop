const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Carrinho = database.define("Carrinho", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Ativo",
        allowNull: false
    }
}, {
    tableName: "Carrinhos"
});

module.exports = Carrinho;