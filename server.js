const sequelize = require('./config/database');

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection to MySQL has been established successfully.');
    const [result, metadata] = await sequelize.query("SELECT * FROM products;")
    console.table (result);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

connectDB();