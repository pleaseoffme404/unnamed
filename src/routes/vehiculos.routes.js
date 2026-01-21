const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehiculos.controller');
const { isAdmin, isAuthenticated } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../middlewares/upload.middleware');

router.get('/', isAuthenticated, controller.obtenerMisVehiculos);
router.post('/', isAuthenticated, uploadImage.single('imagen'), controller.registrarMiVehiculo);
router.put('/:id', isAuthenticated, uploadImage.single('imagen'), controller.actualizarMiVehiculo);
router.delete('/:id', isAuthenticated, controller.eliminarMiVehiculo);

router.post('/admin', isAdmin, uploadImage.single('imagen'), controller.createVehiculo);
router.get('/alumno/:id', isAdmin, controller.getVehiculosByAlumno);
router.put('/admin/:id', isAdmin, uploadImage.single('imagen'), controller.updateVehiculo);
router.delete('/admin/:id', isAdmin, controller.deleteVehiculo);

module.exports = router;