// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

router.get('/', (req, res) => {
    res.redirect("/report")
});

router.get('/login', controller.showLogin);

module.exports = router;
