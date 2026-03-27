const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { body } = require("express-validator")

router.get('/', (req, res) => {
    if (req.session.userId)
        res.redirect("/report")
    else 
        res.redirect("/login")
});


router.get('/login', controller.showLogin);
router.post("/login", controller.login);
router.get('/logout', controller.logout);

module.exports = router;
