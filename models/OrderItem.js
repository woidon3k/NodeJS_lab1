const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  priceAtSale: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { updatedAt: false });

module.exports = OrderItem;