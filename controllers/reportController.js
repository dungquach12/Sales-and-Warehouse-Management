const controller = {};
const models = require("../models");
const { where, Op } = require("sequelize");

controller.showReport = async (req, res) => {
    try {
        res.render('report', {
            title: 'Tổng quan',
            activeMenu: 'report',
            pageCSS: 'report.css',
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

