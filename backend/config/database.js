const { Sequelize } = require('sequelize');

const { DB_database, DB_username, DB_password } = process.env;

// Connecting to the database
const sequelize = new Sequelize(DB_database, DB_username, DB_password, {
  host: 'localhost',
  dialect: 'postgres',
  define: {
    underscored: true,
    freezeTableName: true
  }
});

sequelize.options.logging = false;

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database: ', error);
  });

module.exports = sequelize;
