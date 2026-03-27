const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { body } = require("express-validator")

router.get('/', (req, res) => {
    if (req.session.user_id)
        res.redirect("/report")
    else 
        res.redirect("/login")
});


router.get('/login', controller.showLogin);
router.get('/register', controller.showRegister);

router.post("/login", controller.login);

module.exports = router;
