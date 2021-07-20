const express = require('express')
const router = express.Router()

const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')

// home route
router.get('/', (req, res) => {
  res.render('index')
})

// product route
router.get('/products', productController.getProducts)

// cart route
router.get('/cart', cartController.getCart)
router.post('/cart', cartController.postCart)

module.exports = router
