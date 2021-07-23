require('dotenv').config()
const db = require('../models')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

const tradeData = {
  MerchantID: process.env.MERCHANT_ID,
  HashKey: process.env.HASH_KEY,
  HashIV: process.env.HASH_IV,
  Newebpay: 'https://ccore.newebpay.com/MPG/mpg_gateway',
  ReturnURL: process.env.URL + '/newebpay/callback?from=ReturnURL',
  NotifyURL: process.env.URL + '/newebpay/callback?from=NotifyURL',
  ClientBackURL: process.env.URL + '/orders'
}

async function generateTransporter (order) {
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

function create_mpg_aes_decrypt (TradeInfo) {
  const decrypt = crypto.createDecipheriv('aes256', tradeData.HashKey, tradeData.HashIV)
  decrypt.setAutoPadding(false)
  const text = decrypt.update(TradeInfo, 'hex', 'utf8')
  const plainText = text + decrypt.final('utf8')
  const result = plainText.replace(/[\x00-\x20]+/g, '')
  return result
}

function genDataChain (TradeInfo) {
  const results = []
  for (const kv of Object.entries(TradeInfo)) {
    results.push(`${kv[0]}=${kv[1]}`)
  }
  return results.join('&')
}

function create_mpg_aes_encrypt (TradeInfo) {
  const encrypt = crypto.createCipheriv('aes256', tradeData.HashKey, tradeData.HashIV)
  const enc = encrypt.update(genDataChain(TradeInfo), 'utf8', 'hex')
  return enc + encrypt.final('hex')
}

function create_mpg_sha_encrypt (TradeInfo) {
  const sha = crypto.createHash('sha256')
  const plainText = `HashKey=${tradeData.HashKey}&${TradeInfo}&HashIV=${tradeData.HashIV}`

  return sha.update(plainText).digest('hex').toUpperCase()
}

function getTradeInfo (Amt, Desc, email) {
  console.log('===== getTradeInfo =====')
  console.log(Amt, Desc, email)
  console.log('==========')

  const data = {
    MerchantID: tradeData.MerchantID, // 商店代號
    RespondType: 'JSON', // 回傳格式
    TimeStamp: Date.now(), // 時間戳記
    Version: 1.6, // 串接程式版本
    MerchantOrderNo: Date.now(), // 商店訂單編號
    LoginType: 0, // 智付通會員
    OrderComment: 'OrderComment', // 商店備註
    Amt: Amt, // 訂單金額
    ItemDesc: Desc, // 產品名稱
    Email: email, // 付款人電子信箱
    ReturnURL: tradeData.ReturnURL, // 支付完成返回商店網址
    NotifyURL: tradeData.NotifyURL, // 支付通知網址/每期授權結果通知
    ClientBackURL: tradeData.ClientBackURL // 支付取消返回商店網址
  }

  console.log('===== getTradeInfo: data =====')
  console.log(data)

  const mpg_aes_encrypt = create_mpg_aes_encrypt(data)
  const mpg_sha_encrypt = create_mpg_sha_encrypt(mpg_aes_encrypt)

  console.log('===== getTradeInfo: mpg_aes_encrypt, mpg_sha_encrypt =====')
  console.log(mpg_aes_encrypt)
  console.log(mpg_sha_encrypt)

  const tradeInfo = {
    MerchantID: tradeData.MerchantID, // 商店代號
    TradeInfo: mpg_aes_encrypt, // 加密後參數
    TradeSha: mpg_sha_encrypt,
    Version: 1.6, // 串接程式版本
    Newebpay: tradeData.Newebpay,
    MerchantOrderNo: data.MerchantOrderNo
  }

  console.log('===== getTradeInfo: tradeInfo =====')
  console.log(tradeInfo)

  return tradeInfo
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
      const tradeInfo = getTradeInfo(order.amount, '產品', 'cccc1589@gmail.com')
      order.update({
        ...req.body,
        sn: tradeInfo.MerchantOrderNo
      })
        .then(order => {
          return res.render('payment', { order: order.toJSON(), tradeInfo })
        })
    })
  },
  newebpayCallback: (req, res) => {
    console.log('===== newebpayCallback =====')
    console.log(req.body)
    console.log('==========')

    return res.redirect('/orders')
  }
}

module.exports = orderController
