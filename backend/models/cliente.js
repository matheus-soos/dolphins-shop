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
        // DATEONLY evita o deslocamento de fuso horário (ex.: 15/03 virar 14/03)
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    cep: {
        type: DataTypes.STRING,
        allowNull: false
    },
    logradouro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numero: {
        type: DataTypes.STRING,
        allowNull: false
    },
    complemento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bairro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cidade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pais: {
        type: DataTypes.STRING,
        defaultValue: 'Brasil',
        allowNull: false
    }
}, {
    tableName: "Clientes"
});

module.exports = Cliente;