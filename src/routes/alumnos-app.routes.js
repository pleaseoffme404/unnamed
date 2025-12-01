const express = require('express');
const router = express.Router();
const controller = require('../controllers/alumnos-app.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const { uploadImage, handleUploadError } = require('../middlewares/upload.middleware');
const { changePasswordValidator } = require('../middlewares/validator.middleware');

router.get('/perfil', isAuthenticated, controller.getMiPerfil);

router.post('/vehiculo', 
    isAuthenticated, 
    uploadImage.single('imagen'), 
    handleUploadError, 
    controller.updateMiVehiculo
);

router.post('/cambiar-password', 
    isAuthenticated, 
    changePasswordValidator, 
    controller.cambiarPassword
);

module.exports = router;