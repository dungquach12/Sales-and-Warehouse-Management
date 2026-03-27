const controller = {};
const models = require("../models");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { where, Op } = require("sequelize");

// ---- Login func ----
controller.showLogin = (req, res) => {
    res.render('authenticate/auth-login', {
        title: 'Đăng nhập',
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

        req.session.userId = user.id;
        req.session.username = user.username;

        res.redirect('/report');
    } catch (error) {
        console.log("Error:", error);
        res.render("authenticate/auth-login", {
            layout: "auth-layout",
            title: "Đăng nhập",
            message: "Something went wrong"
        });
    }
}

controller.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout error", err);
            return res.redirect('/report');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};


// ---- Register func ----
// controller.showRegister = (req, res) => {
//     res.render('authenticate/auth-register', {
//         title: 'Đăng ký',
//         layout: 'auth-layout'
//     });
// }

// controller.register = async (req, res) => {
//     if (res.locals.message) {
//         return res.render("auth-register", {
//             layout: "auth",
//             title: "Register"
//         });
//     }

//     const { username, email, password } = req.body;

//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);

//         await models.User.create({
//             username,
//             email,
//             password_hash: hashedPassword,
//             role: staff
//         });

//         res.render("authenticate/auth-login", {
//             layout: "auth-layout",
//             message: "User created"
//         });
//     } catch (error) {
//         console.error(error);
//         res.render("authenticate/auth-register", {
//             layout: "auth-layout",
//             message: "Something went wrong. Please try again"
//         });
//     }
// }

module.exports = controller;