const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { updatedAt: false });

module.exports = Order;