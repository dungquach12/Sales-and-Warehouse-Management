const router = require('express').Router();
const controller = require("../../../controllers/api/v1/productApiController");

const { checkAuth } = require("../../../utils/checkAuth")

router.get("/", checkAuth, controller.getAllActiveProducts);
router.get("/inactive", checkAuth, controller.getAllInactiveProducts);
// router.get('/check-name', checkAuth, controller.checkName);
router.post("/create", checkAuth, controller.createProduct);
router.post("/edit/:id", checkAuth, controller.editProduct);
router.post("/archive/:id", checkAuth, controller.archiveProduct);
router.post("/unarchive/:id", checkAuth, controller.unarchiveProduct);
// router.delete("/:id", checkAuth, controller.deleteProduct);

module.exports = router;