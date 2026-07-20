const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.get('/', isAuthenticated, supplierController.getAll);
router.get('/:id', isAuthenticated, supplierController.getOne);
router.post('/', isAuthenticated, supplierController.create);
router.put('/:id', isAuthenticated, supplierController.update);
router.delete('/:id', isAuthenticated, supplierController.remove);

module.exports = router;
