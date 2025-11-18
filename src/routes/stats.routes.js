const express = require('express');
const router = express.Router();
const controller = require('../controllers/stats.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

router.get('/counts', isAuthenticated, isAdmin, controller.getCounts);

module.exports = router;