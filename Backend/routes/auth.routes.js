const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);
router.post('/change-password', isAuthenticated, authController.changePassword);
router.get('/me', isAuthenticated, authController.me);

module.exports = router;
