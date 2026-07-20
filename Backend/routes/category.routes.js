const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.get('/', isAuthenticated, categoryController.getAll);
router.post('/', isAuthenticated, categoryController.create);
router.put('/:id', isAuthenticated, categoryController.update);
router.delete('/:id', isAuthenticated, categoryController.remove);

module.exports = router;
