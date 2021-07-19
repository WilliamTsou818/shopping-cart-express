'use strict'

const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Payments',
      Array.from({ length: 5 }).map((item, index) =>
        ({
          amount: faker.datatype.number(),
          sn: faker.datatype.number(),
          payment_method: Math.floor(Math.random() * 3) + 1,
          paid_at: new Date(),
          params: null,
          OrderId: Math.floor(Math.random() * 2) + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Payments', null, {})
  }
}
