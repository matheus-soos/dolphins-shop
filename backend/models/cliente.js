const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');


const Cliente = database.define("Cliente", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cpf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    data_nascimento: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "Clientes"
});

module.exports = Cliente;