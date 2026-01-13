const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Pedido_Venda = database.define("Pedido_Venda", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    endereco_entrega_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    cupom_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Pendente", // "Pendente", "Pago", "Enviado", "Cancelado"
        allowNull: false
    },
    forma_pagamento: {
        type: DataTypes.STRING,
        allowNull: true // Ex: "Pix", "Cartão", "Dinheiro"
    },
    valor_total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    desconto_total: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    frete: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: "Pedidos_Venda"
});

module.exports = Pedido_Venda;