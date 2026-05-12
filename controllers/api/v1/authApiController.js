const controller = {};
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { User } = require("../../../models");
const { Op } = require("sequelize");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

// Authentication Middleware
controller.authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        return res.status(403).json({
            success: false,
            message: "Invalid token."
        });
    }
};

// Optional: Optional auth middleware (doesn't block if no token)
controller.optionalAuth = (req, res, next) => {
    const token = req.cookies?.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Invalid token - just continue without user
            console.log("Invalid optional auth token");
        }
    }
    next();
};

controller.login = async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    
    // Validation
    if (!usernameOrEmail || !password) {
        return res.status(400).json({
            success: false,
            message: "Username/email and password are required"
        });
    }
    
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            }
        });

        // Check if user exists AND password matches
        // Note: Adjust field name to match your database column
        if (!user || !(await argon2.verify(user.password, password))) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create token (never include sensitive data like password)
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                email: user.email // Optional: include if needed
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,   
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Return user info (excluding sensitive data)
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during login"
        });
    }
};

controller.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
        redirect: '/login'
    });
};

controller.getCurrentUser = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }

    return res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            email: req.user.email
        }
    });
};

module.exports = controller;