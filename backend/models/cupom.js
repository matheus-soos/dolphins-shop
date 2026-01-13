const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Cupom = database.define("Cupom", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantidade_uso: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    data_fim: {
        type: DataTypes.DATE,
        allowNull: false
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: "Cupons"
});

module.exports = Cupom;