require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "mssql",
  host: process.env.DB_SERVER,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});

module.exports = sequelize;
