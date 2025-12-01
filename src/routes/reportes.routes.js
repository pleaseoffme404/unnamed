const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportes.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const { reporteValidator } = require('../middlewares/validator.middleware');

router.get('/asistencia', isAdmin, reporteValidator, controller.generarReporteAsistencia);
router.get('/alumnos', isAdmin, controller.generarReporteAlumnos);

module.exports = router;