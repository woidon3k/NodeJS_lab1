require('dotenv').config();
const sequelize = require('./config/database');

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

async function startApp() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    await runDemo();
  } catch (error) {
    console.error('Error starting application:', error);
  }
}

async function runDemo() {
  // Create staff and inventory
  const cashier = await User.create({ name: 'Andriy', role: 'cashier' });
  const milk = await Product.create({ 
    name: 'Milk 2.6%', 
    price: 45.00, 
    stock: 50 
  });

  const newOrder = await Order.create({ 
    totalAmount: 90.00, 
    userId: cashier.id 
  });

  await OrderItem.create({
    orderId: newOrder.id,
    productId: milk.id,
    quantity: 2,
    priceAtSale: 45.00
  });

  const orders = await Order.findAll({
    include: [
      { model: User },
      { model: OrderItem, include: [Product] }
    ]
  });

  console.log('Current Orders Data:', JSON.stringify(orders, null, 2));
}

startApp();