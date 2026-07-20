const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.get('/', isAuthenticated, salesController.getAll);
router.post('/', isAuthenticated, salesController.create);

module.exports = router;
