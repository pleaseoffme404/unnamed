const express = require('express');
const router = express.Router();
const controller = require('../controllers/qr.controller');

router.get('/generate', controller.generateQRToken);

module.exports = router;