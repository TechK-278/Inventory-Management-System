const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', isAuthenticated, productController.getAll);
router.get('/:id', isAuthenticated, productController.getOne);
router.post('/', isAuthenticated, upload.single('image'), productController.create);
router.put('/:id', isAuthenticated, upload.single('image'), productController.update);
router.delete('/:id', isAuthenticated, productController.remove);

module.exports = router;
