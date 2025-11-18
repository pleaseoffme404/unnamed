const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnos.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post(
    '/alumnos/register', 
    isAuthenticated, 
    upload.single('foto_alumno'), 
    alumnosController.createAlumno
);

router.post(
    '/alumnos/mass-register', 
    isAuthenticated, 
    upload.single('archivo_csv'), 
    alumnosController.uploadAlumnosCSV
);

module.exports = router;