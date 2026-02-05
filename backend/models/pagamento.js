const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Pagamento = database.define('Pagamento', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    pedido_venda_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    charge_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nsu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tipo_pagamento: {
        type: DataTypes.ENUM('Pix', 'Credito'),
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PendingPayment'
    },
    adquirente: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    qr_code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qr_code_base64: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    token_pix: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bandeira: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autorizacao: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parcelas: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tipo_parcelamento: {
        type: DataTypes.STRING, // Ex: 'Loja' ou 'Adm'
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_capturado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_cancelado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    data_transacao: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'Pagamentos',
    timestamps: true
})

module.exports = Pagamento;