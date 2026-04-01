const controller = {};
const { Product, Category } = require("../../../models");
const { Op } = require("sequelize");

controller.getAllActiveProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: Category,
            where: {
                is_active: true
            }
        });
        res.json({ success: true, data: products });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.getAllInactiveProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: Category,
            where: {
                is_active: false
            }
        });
        res.json({ success: true, data: products });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.checkName = async (req, res) => {
  try {
    const { name } = req.query;
    
    const product = await Product.findOne({
      where: { name },
      paranoid: false
    });

    if (!product) return res.json({ exists: false });
    
    res.json({
      exists: true,
      is_active: product.is_active
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Check failed' });
  }
};

controller.createProduct = async (req, res) => {
    const { name, price, cost, categoryId } = req.body;
    try {
        const newProduct = await Product.create({ name, price, cost, categoryId });
        res.json({ success: true, data: newProduct });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports = controller;