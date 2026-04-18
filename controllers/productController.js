const controller = {};

controller.showProduct = async (req, res) => {
    try {
        res.render('products', {
            title: 'Sản phẩm',
            activeMenu: 'products',
            activeParent: 'productManage',
            pageCSS: 'products.css',
        });
    } catch (error) {
        console.error("Error loading product page:", error);
        // Fallback if 'error' view still doesn't exist
        res.status(500).send("Internal Server Error: Could not load products.");
    }
};

module.exports = controller;

