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
        defaultValue: "Pendente",
        allowNull: false
    },
    forma_pagamento: {
        type: DataTypes.STRING,
        allowNull: true
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
        beforeValidate: async (pedido, options) => {
            if (pedido.numero_pedido) return;

            const PedidoModel = pedido.constructor;
            const maxNumero = await PedidoModel.max('numero_pedido', { transaction: options.transaction });
            
            const proximo = maxNumero ? Number(maxNumero) + 1 : 1;

            console.log('Último número:', maxNumero, '| Próximo número:', proximo);

            pedido.numero_pedido = String(proximo).padStart(6, '0');
            console.log(pedido.numero_pedido)
        }
    }
});

module.exports = Pedido_Venda;