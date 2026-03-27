const controller = {};
const { user } = require("pg/lib/defaults");
const models = require("../models");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { where, Op } = require("sequelize");

controller.showLogin = (req, res) => {
    res.render('authenticate/auth-login', {
        title: 'Đăng nhập',
        layout: 'auth-layout'
    });
}

controller.showRegister = (req, res) => {
    res.render('authenticate/auth-login', {
        title: 'Đăng ký',
        layout: 'auth-layout'
    });
}

controller.login = async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    try {
        const user = await models.User.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            }
        })

        if (!user) {
            return res.render("authenticate/auth-login", {
                layout: "auth-layout",
                title: "Đăng nhập",
                message: "Invalid username, email or password"
            });
        }

        if (bcrypt.compareSync(password, user.password_hash) == false) {
            return res.render("authenticate/auth-login", {
                layout: "auth-layout",
                title: "Đăng nhập",
                message: "Invalid username, email or password"
            });
        }

        req.session.user_id = user.user_id;
        req.session.username = user.username;
        req.session.profile_picture = user.profile_picture;

        res.redirect('/');
    } catch (error) {
        console.log("Error:", error);
        res.render("authenticate/auth-login", {
            layout: "auth-layout",
            title: "Đăng nhập",
            message: "Something went wrong"
        });
    }
}

module.exports = controller;