const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnos.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

router.use(isAuthenticated);

router.get('/', alumnosController.getAllAlumnos);

router.post('/', alumnosController.createAlumno);

module.exports = router;