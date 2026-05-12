const router = require('express').Router();
const controller = require('../../../controllers/api/v1/orderApiController');

router.post('/create-order', controller.createOrder);

module.exports = router;