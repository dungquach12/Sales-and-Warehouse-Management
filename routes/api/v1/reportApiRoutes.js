const router = require('express').Router();
const controller = require("../../../controllers/api/v1/reportApiController");

router.get("/", controller.getAllReport);

module.exports = router;