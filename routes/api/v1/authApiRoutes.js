const router = require('express').Router();
const controller = require('../../../controllers/api/v1/authApiController');

router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", controller.getCurrentUser);

module.exports = router;