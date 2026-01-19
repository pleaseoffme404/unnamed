const express = require('express');
const router = express.Router();
const controller = require('../controllers/asistencia.controller');
const { isAdmin, isAuthenticated } = require('../middlewares/auth.middleware');

router.get('/', isAdmin, controller.getHistorial);
router.get('/alumno/:id', isAdmin, controller.getHistorialByAlumno);
router.post('/registrar-qr', isAuthenticated, controller.registrarAsistenciaQR);
router.get('/historial', isAuthenticated, controller.obtenerMiHistorial);
router.post('/simular', isAdmin, controller.simularMovimiento);

module.exports = router;