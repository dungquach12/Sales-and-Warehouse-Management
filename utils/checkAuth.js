const express = require("express");

const checkAuth = (req, res, next) => {
    if (req.session.userId) return next();

    if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
    res.redirect("/login");
};

module.exports = { checkAuth };