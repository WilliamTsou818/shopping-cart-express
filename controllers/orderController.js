require('dotenv').config()
const db = require('../models')
const nodemailer = require('nodemailer')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

async function generateTransporter (order) {
  console.log(process.env.MAIL_PASSWORD)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  })

  const mailOptions = {
    from: process.env.MAIL,
    to: process.env.MAIL,
    subject: `${order.id} 訂單成立`,
    text: `${order.id} 訂單成立`
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      nest: true,
      include: 'items',
      where: { shipping_status: 0, payment_status: 0 }
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
  },
  postOrder: (req, res) => {
    return Cart.findByPk(req.body.cartId, { include: 'items' }).then(cart => {
      return Order.create({
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        shipping_status: req.body.shipping_status,
        payment_status: req.body.payment_status,
        amount: req.body.amount
      })
        .then(order => {
          const results = []
          for (let i = 0; i < cart.items.length; i++) {
            results.push(
              OrderItem.create({
                OrderId: order.id,
                ProductId: cart.items[i].id,
                price: cart.items[i].price,
                quantity: cart.items[i].CartItem.quantity
              })
            )
          }
          // send mail
          generateTransporter(order)

          return Promise.all(results).then(() =>
            res.redirect('/orders')
          )
        })
    })
  },
  cancelOrder: (req, res) => {
    return Order.findByPk(req.params.id).then(order => {
      order.update({
        ...req.body,
        shipping_status: '-1',
        payment_status: '-1'
      }).then(() => {
        return res.redirect('back')
      })
    })
  },
  getPayment: (req, res) => {
    console.log('===== getPayment =====')
    console.log(req.params.id)
    console.log('==========')

    return Order.findByPk(req.params.id, {}).then(order => {
      return res.render('payment', { order: order.toJSON() })
    })
  },
  newebpayCallback: (req, res) => {
    console.log('===== newebpayCallback =====')
    console.log(req.body)
    console.log('==========')

    return res.redirect('back')
  }
}

module.exports = orderController
