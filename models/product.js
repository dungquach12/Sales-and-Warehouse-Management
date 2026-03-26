"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.Category, { foreignKey: "category_id" });
      Product.hasMany(models.OrderItem, { foreignKey: "product_id" });
    }
  }
  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: DataTypes.STRING,
      category_id: {
        type: DataTypes.UUID,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      price: DataTypes.DECIMAL,
      cost: DataTypes.DECIMAL,
      image: DataTypes.STRING,
      is_active: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Product",
      underscored: true,
    },
  );

  return Product;
};
