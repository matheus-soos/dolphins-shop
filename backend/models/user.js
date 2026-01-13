const { Sequelize, DataTypes } = require('sequelize');
const database = require('../config/database');

const User = database.define("User", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: "Users"
});

module.exports = User;