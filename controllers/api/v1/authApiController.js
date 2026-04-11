const controller = {};
require("dotenv").config();
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { User } = require("../../../models");
const { Op } = require("sequelize");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

controller.login = async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            }
        })

        if (!user || !(await argon2.verify(user.password_hash, password))) {
            return res
                .status(401)
                .json(
                    { 
                        success: false, 
                        message: 'Invalid credentials' 
                    }
                )
        };

        // create token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.cookie('token', token, {
            httpOnly: true,   
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during login"
        });
    }
}

controller.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.status(200).json({
        success: true,
        message: "Logged out",
        redirect: '/login'
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