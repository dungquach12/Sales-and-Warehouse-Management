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

controller.archiveProduct = async (req, res) => {
    console.log("Archive product request received");
    const { id } = req.params;
    try {
        await Product.update({ is_active: false }, { where: { id } });
        res.json({ success: true, message: "Product archived" });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.unarchiveProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.update({ is_active: true }, { where: { id } });
        res.json({ success: true, message: "Product restored" });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.destroy({ where: { id }, force: true });
        res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.editProduct = async (req, res) => {   
    console.log("Edit product request received");
    const { id } = req.params;
    const { name, price, cost, category, image } = req.body;

    let categoryId = null;
    if (category) {
        const foundCategory = await Category.findOne({ where: { name: category } });
        if (foundCategory) {
            categoryId = foundCategory.id;
        } else {
            return res.status(400).json({ success: false, message: "Category not found" });
        }  
    } 

    try {
        await Product.update({ name, price, cost, categoryId, image }, { where: { id } });
        res.json({ success: true, message: "Product updated" });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports = controller;