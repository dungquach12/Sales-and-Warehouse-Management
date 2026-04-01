const router = require('express').Router();
const controller = require("../../../controllers/api/v1/productApiController");

router.get("/", controller.getAllActiveProducts);
router.get("/inactive", controller.getAllInactiveProducts);
router.get('/check-name', controller.checkName);
router.post("/", controller.createProduct);
// router.put("/:id", controller.updateProduct);
// router.delete("/:id", controller.deleteProduct);

module.exports = router;