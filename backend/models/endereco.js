const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Endereco = database.define("Endereco", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cep: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rua: {
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
    },
    principal: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: "Enderecos"
});

module.exports = Endereco;