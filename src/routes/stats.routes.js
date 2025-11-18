const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

router.get('/stats/counts', isAuthenticated, statsController.getCounts);

module.exports = router;