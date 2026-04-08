const router = require('express').Router();
const controller = require('../../../controllers/api/v1/authApiController');

const { checkAuth } = require("../../../utils/checkAuth")

router.post("/login", controller.login);
router.post("/logout", checkAuth, controller.logout);

module.exports = router;