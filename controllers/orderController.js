const db = require('../models')
const Order = db.Order

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      nest: true,
      include: 'items'
    }).then(orders => {
      orders = orders.map(order => ({
        ...order.dataValues,
        items: order.items.map(product => ({
          name: product.dataValues.name,
          price: product.dataValues.price,
          OrderItem: product.dataValues.OrderItem.dataValues
        }))
      }))
      return res.render('orders', { orders })
    })
  }
}

module.exports = orderController