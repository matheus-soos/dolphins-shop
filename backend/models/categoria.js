const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Categoria = database.define("Categoria", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Ativo",
        allowNull: false
    }
}, {
    tableName: "Categorias"
});

module.exports = Categoria;