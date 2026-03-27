const express = require("express");

const checkAuth = (req, res, next) => {
    if (req.session.userId) {
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        res.redirect("/login"); // User is not authenticated, redirect to login
    }
};

module.exports = { checkAuth }