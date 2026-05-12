const controller = {};

controller.showOrderPage = async (req, res) => {
    try {
        res.render('order', {
            title: 'Đơn hàng',
            activeMenu: 'order',
            pageCSS: 'order.css',
        });
    } catch (error) {
        console.error("Error loading order page:", error);
        res.status(500).render("error", { message: "Could not load order page" });
    }
};

module.exports = controller;