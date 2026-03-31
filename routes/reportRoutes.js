const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportController");

const { checkAuth } = require("../utils/checkAuth")

router.get('/', checkAuth, controller.showReport);

module.exports = router;