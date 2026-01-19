const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehiculos.controller');
// Importamos ambos middlewares
const { isAdmin, isAuthenticated } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../middlewares/upload.middleware');

// --- RUTAS PARA ALUMNOS (Móvil) ---
// GET /api/vehiculos -> Devuelve los vehículos del alumno logueado
router.get('/', isAuthenticated, controller.obtenerMisVehiculos);

// POST /api/vehiculos -> Registra un vehículo para el alumno logueado
router.post('/', isAuthenticated, controller.registrarMiVehiculo);


// --- RUTAS PARA ADMINS (Existentes) ---
// Se mantiene la lógica de subida de imágenes para el panel web
router.post('/admin', isAdmin, uploadImage.single('imagen'), controller.createVehiculo);
router.get('/alumno/:id', isAdmin, controller.getVehiculosByAlumno);
router.put('/:id', isAdmin, uploadImage.single('imagen'), controller.updateVehiculo);
router.delete('/:id', isAdmin, controller.deleteVehiculo);

module.exports = router;