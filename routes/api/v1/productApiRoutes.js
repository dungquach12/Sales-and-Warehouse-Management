const router = require('express').Router();
const controller = require("../../../controllers/api/v1/productApiController");

router.get("/", controller.getAllActiveProducts);
router.get("/inactive", controller.getAllInactiveProducts);
// router.get('/check-name', controller.checkName);
router.post("/create", controller.createProduct);
router.post("/edit/:id", controller.editProduct);
router.post("/archive/:id", controller.archiveProduct);
router.post("/unarchive/:id", controller.unarchiveProduct);
// router.delete("/:id", checkAuth, controller.deleteProduct);

module.exports = router;