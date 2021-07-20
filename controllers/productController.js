const db = require('../models')
const Product = db.Product
const Cart = db.Cart
const PAGE_LIMIT = 3
const PAGE_OFFSET = 0

const productController = {
  getProducts: (req, res) => {
    return Promise.all([
      Product.findAndCountAll({
        raw: true,
        nest: true,
        offset: PAGE_OFFSET,
        limit: PAGE_LIMIT
      }),
      Cart.findByPk(req.session.cartId, {
        include: { model: Product, as: 'items' }
      })
    ])
      .then(([products, cart]) => {
        cart ? cart = cart.toJSON() : cart = { items: [] }
        const totalPrice = cart.items.length > 0 ? cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0
        return res.render('products', { products, cart, totalPrice })
      })
  }
}

module.exports = productController
