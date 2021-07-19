const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem
const Product = db.Product

const cartController = {
  getCart: (req, res) => {
    return Cart.findOne({
      include: { model: Product, as: 'items' }
    })
      .then(cart => {
        const totalPrice = cart.items.length > 0 ? cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0
        return res.render('cart', {
          cart: cart.toJSON(),
          totalPrice
        })
      })
  }
}

module.exports = cartController
