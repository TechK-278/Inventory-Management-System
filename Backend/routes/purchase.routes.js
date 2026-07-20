const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.get('/', isAuthenticated, purchaseController.getAll);
router.post('/', isAuthenticated, purchaseController.create);

module.exports = router;
