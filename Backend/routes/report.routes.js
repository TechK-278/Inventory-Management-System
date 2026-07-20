const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Dashboard
router.get('/summary', isAuthenticated, reportController.dashboardSummary);

// Reports
router.get('/sales', isAuthenticated, reportController.salesReport);
router.get('/purchases', isAuthenticated, reportController.purchaseReport);
router.get('/stock', isAuthenticated, reportController.stockReport);
router.get('/profit', isAuthenticated, reportController.profitReport);

module.exports = router;
