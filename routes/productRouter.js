const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");

const { checkAuth } = require("../utils/checkAuth")

router.get('/', checkAuth, controller.showProduct);

module.exports = router;