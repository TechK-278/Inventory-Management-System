const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.get('/', isAuthenticated, customerController.getAll);
router.get('/:id', isAuthenticated, customerController.getOne);
router.post('/', isAuthenticated, customerController.create);
router.put('/:id', isAuthenticated, customerController.update);
router.delete('/:id', isAuthenticated, customerController.remove);

module.exports = router;
