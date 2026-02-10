const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Pedido_Venda = database.define("Pedido_Venda", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    numero_pedido: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true
    },
    cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    tableName: "Pedidos_Venda",
    hooks: {
        beforeValidate: async (pedido) => {

            // se já veio preenchido, não mexe
            if (pedido.numero_pedido) return;

            const result = await database.query(
                `SELECT nextval('pedidos_venda_numero_seq') as numero`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            pedido.numero_pedido = String(result[0].numero).padStart(6, "0");
        }
    }

});

module.exports = Pedido_Venda;