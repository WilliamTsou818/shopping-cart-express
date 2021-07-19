'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Cart.belongsToMany(models.Product, {
        as: 'items',
        through: {
          model: models.CartItem, unique: false
        },
        foreignKey: 'CartId'
      })
    }
  };
  Cart.init({
  }, {
    sequelize,
    modelName: 'Cart'
  })
  return Cart
}
