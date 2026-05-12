const router = require('express').Router();
const controller = require('../../../controllers/api/v1/customerApiController');

router.get('/', controller.getCustomer);
router.get('/search', controller.searchCustomers);
router.post('/create-customer', controller.createCustomer);
router.put('/update-customer/:id', controller.updateCustomer);
router.delete('/delete-customer/:id', controller.deleteCustomer);

module.exports = router;