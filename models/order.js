"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, { foreignKey: "user_id" });
      Order.belongsTo(models.Customer, { foreignKey: 'customer_id' });
      Order.hasMany(models.OrderItem, { foreignKey: "order_id" });
    }
  }
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        references: {
          model: "Users",
          key: "id",
        },
      },
      customer_id: {
        type: DataTypes.UUID,
        references: {
          model: "Customers",
          key: "id",
        },
      },
      customer_name: DataTypes.STRING,
      payment_method: DataTypes.STRING,
      order_method: DataTypes.STRING,
      total_price: DataTypes.DECIMAL,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "Orders",
      underscored: true,
      timestamps: true,
      updatedAt: false, // orders should never be updated
    },
  );

  return Order;
};
