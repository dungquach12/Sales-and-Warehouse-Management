const controller = {};
const models = require("../models");
const { where, Op } = require("sequelize");

controller.showProduct = async (req, res) => {
    try {
        res.render('products', {
            title: 'Sản phẩm',
            activeMenu: 'products',
            activeParent: 'productManage',
            pageCSS: 'products.css',
            user: {
                username: req.session.username
            }
        });
    } catch (error) {
        console.error("Error loading report:", error);
        res.status(500).render("error", { message: "Could not load report" });
    }
};

module.exports = controller;

