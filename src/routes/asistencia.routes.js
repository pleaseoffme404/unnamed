const express = require('express');
const router = express.Router();
const controller = require('../controllers/asistencia.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

router.get('/', isAdmin, controller.getHistorial);
router.post('/simular', isAdmin, controller.simularMovimiento);

module.exports = router;