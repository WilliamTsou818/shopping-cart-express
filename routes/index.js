const express = require('express')
const router = express.Router()

const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')

// home route
router.get('/', (req, res) => {
  res.render('index')
})

// product route
router.get('/products', productController.getProducts)

// cart route
router.get('/cart', cartController.getCart)
router.post('/cart', cartController.postCart)
router.post('/cartItem/:id/add', cartController.addCartItem)
router.post('/cartItem/:id/sub', cartController.subCartItem)
router.delete('/cartItem/:id', cartController.deleteCartItem)

// order route
router.get('/orders', orderController.getOrders)

module.exports = router
