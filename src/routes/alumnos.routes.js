const express = require('express');
const router = express.Router();
const controller = require('../controllers/alumnos.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const { uploadCsv, uploadImage } = require('../middlewares/upload.middleware');

router.get('/grupos', isAdmin, controller.getGrupos); 

router.get('/', isAdmin, controller.getAllAlumnos);
router.get('/:id', isAdmin, controller.getAlumnoById);
router.post('/', isAdmin, uploadImage.single('imagen'), controller.registerAlumno);
router.put('/:id', isAdmin, uploadImage.single('imagen'), controller.updateAlumno);
router.delete('/:id', isAdmin, controller.deleteAlumno);

router.post('/register-masivo', isAdmin, uploadCsv.single('csvFile'), controller.registerAlumnosMasivo);

module.exports = router;