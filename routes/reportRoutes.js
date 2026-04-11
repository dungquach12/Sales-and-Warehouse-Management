const express = require("express");
const router = express.Router();
const controller = require("../controllers/reportController");

router.get('/', controller.showReport);

module.exports = router;