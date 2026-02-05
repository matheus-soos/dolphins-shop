const { Sequelize, DataTypes } = require("sequelize");
const database = require("../config/database");

const Pedido_Venda_Item = database.define("Pedido_Venda_Item", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  pedido_venda_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },

  produto_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },

  quantidade: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1
  },

  valor_unitario: {
    type: Sequelize.FLOAT,
    allowNull: false
  },

  valor_total: {
    type: Sequelize.FLOAT,
    allowNull: false
  }
}, {
  tableName: "Pedido_Venda_Itens"
});

module.exports = Pedido_Venda_Item;
