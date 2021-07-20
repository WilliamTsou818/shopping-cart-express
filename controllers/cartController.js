const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem
const Product = db.Product

const cartController = {
  getCart: (req, res) => {
    return Cart.findByPk(req.session.cartId, {
      include: { model: Product, as: 'items' }
    })
      .then(cart => {
        cart ? cart = cart.toJSON() : cart = {items: []}
        const totalPrice = cart.items.length > 0 ? cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0
        return res.render('cart', {
          cart,
          totalPrice
        })
      })
  },
  postCart: (req, res) => {
    return Cart.findOrCreate({
      where: {
        id: req.session.cartId || 0,
      }
    })
      .then(cart => {
        cart = cart[0].toJSON()
        return CartItem.findOrCreate({
          where: {
            CartId: cart.id,
            ProductId: req.body.productId
          },
          default: {
            CartId: cart.id,
            ProductId: req.body.productId
          }
        })
          .then(cartItem => {
            cartItem = cartItem[0]
            return cartItem.update({
              quantity: (cartItem.quantity || 0) + 1
            })
              .then(() => {
                req.session.cartId = cart.id
                return req.session.save(() => {
                  return res.redirect('back')
                })
              })
          })
      })
  },
  addCartItem: (req, res) => {
    CartItem.findByPk(req.params.id).then(cartItem => {
      cartItem.update({
        quantity: cartItem.quantity + 1
      })
        .then(() => {
          return res.redirect('back')
        })
    })
  },
  subCartItem: (req, res) => {
    CartItem.findByPk(req.params.id).then(cartItem => {
      cartItem.update({
        quantity: cartItem.quantity - 1 >= 1 ? cartItem.quantity - 1 : 1
      })
        .then(() => {
          return res.redirect('back')
        })
    })
  },
  deleteCartItem: (req, res) => {
    CartItem.findByPk(req.params.id).then(cartItem => {
      cartItem.destroy()
        .then((cartItem) => {
          return res.redirect('back')
        })
    })
  }
}

module.exports = cartController
