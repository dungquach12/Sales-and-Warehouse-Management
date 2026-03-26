'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.associate = (models) => {
        Order.belongsTo(models.User, { foreignKey: 'user_id' });
        Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });
      };
    }
  }
  Order.init({
    user_id: DataTypes.INTEGER,
    customer_name: DataTypes.STRING,
    payment_method: DataTypes.STRING,
    order_method: DataTypes.STRING,
    total_price: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};