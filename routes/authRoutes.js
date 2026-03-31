// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

router.get('/', (req, res) => {
    if (req.session.userId)
        res.redirect("/report")
    else 
        res.redirect("/login")
});

router.get('/login', controller.showLogin);

module.exports = router;
