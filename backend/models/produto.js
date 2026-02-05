const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const Produto = database.define("Produto", {
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
    subcategoria_id: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        allowNull: false
    },
    imgPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cod_produto: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    modelo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fabricante: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor_custo: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    valor_venda: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // ncm: {
    //     type: DataTypes.STRING,
    //     allowNull: false
    // },
    // cfop: {
    //     type: DataTypes.STRING,
    //     allowNull: false
    // },
    // cest: {
    //     type: DataTypes.STRING,
    //     allowNull: false
    // },
    peso: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false
    },
    altura: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    largura: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    comprimento: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    saldo: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    // estoque_min: {
    //     type: DataTypes.DOUBLE,
    //     allowNull: true
    // },
    cod_barras: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Disponível'
    }
}, {
    tableName: "Produtos"
});

module.exports = Produto;