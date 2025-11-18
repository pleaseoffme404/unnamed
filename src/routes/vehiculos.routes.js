const express = require('express');
const router = express.Router();
const controller = require('../controllers/vehiculos.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../middlewares/upload.middleware');

router.post('/', isAdmin, uploadImage.single('imagen'), controller.createVehiculo);
router.get('/alumno/:id', isAdmin, controller.getVehiculosByAlumno);
router.put('/:id', isAdmin, uploadImage.single('imagen'), controller.updateVehiculo);
router.delete('/:id', isAdmin, controller.deleteVehiculo);

module.exports = router;