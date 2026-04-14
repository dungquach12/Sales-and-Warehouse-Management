const router = require('express').Router();
const controller = require("../../../controllers/api/v1/productApiController");

router.get("/", controller.getAllActiveProducts);
router.get("/inactive", controller.getAllInactiveProducts);
router.get("/category", controller.getAllActiveCategories);
router.get('/check-name', controller.checkName);


router.post("/create", controller.createProduct);
router.post("/archive/:id", controller.archiveProduct);
router.post("/unarchive/:id", controller.unarchiveProduct);

router.put("/edit/:id", controller.editProduct);

router.delete("/delete/bulk", controller.bulkDeleteProducts);


module.exports = router;