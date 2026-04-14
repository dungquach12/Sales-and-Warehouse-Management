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
        return res.json({ success: true, data: products });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
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
        return res.json({ success: true, data: products });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.getAllActiveCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        return res.json({ success: true, data: categories });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

controller.checkName = async (req, res) => {
  try {
    const { name } = req.query;
    
    const product = await Product.findOne({
      where: { name },
      paranoid: false
    });

    if (!product) return res.json({ exists: false });
    
    return res.json({
      exists: true,
      is_active: product.is_active
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Check failed' });
  }
};

controller.createProduct = async (req, res) => {
    const { name, category_id, price, cost, image } = req.body;
    try {
        const newProduct = await Product.create({ name, category_id, price, cost, image, is_active: true });
        return res.json({ success: true, data: newProduct });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.editProduct = async (req, res) => {   
    const { id } = req.params;
    const { name, price, cost, category_id, image } = req.body;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Mặt hàng không tồn tại" });
        }

        // Validate category if the user actually changed it/provided it
        let finalCategoryId = product.categoryId; 
        if (category_id !== undefined && category_id !== null && category_id !== "") {
            const foundCategory = await Category.findByPk(category_id);
            if (!foundCategory) {
                return res.status(400).json({ success: false, message: "Danh mục không hợp lệ" });
            }
            finalCategoryId = foundCategory.id;
        }

        await product.update({ 
            name: name?.trim() || product.name, 
            price: (price !== undefined && price !== null) ? price : product.price, 
            cost: (cost !== undefined && cost !== null) ? cost : product.cost, 
            category_id: finalCategoryId,
            image: image || product.image 
        });

        return res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật" });
    }
};



controller.archiveProduct = async (req, res) => {
    console.log("Archive product request received");
    const { id } = req.params;
    try {
        await Product.update({ is_active: false }, { where: { id } });
        return res.json({ success: true, message: "Product archived" });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.unarchiveProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.update({ is_active: true }, { where: { id } });
        return res.json({ success: true, message: "Product restored" });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

controller.bulkDeleteProducts = async (req, res) => {
    const { ids } = req.body; // Expecting an array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "No product IDs provided" });
    }

    try {
        await Product.destroy({ where: { id: { [Op.in]: ids } }, force: true });
        return res.json({ success: true, message: "Products deleted" });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports = controller;