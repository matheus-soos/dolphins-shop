const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Subcategoria = database.define("Subcategoria", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    categoria_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false
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
    tableName: "Subcategorias"
});

module.exports = Subcategoria;