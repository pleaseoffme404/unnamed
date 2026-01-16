const express = require('express');
const router = express.Router();
const controller = require('../controllers/tutores.controller');
const anunciosController = require('../controllers/anuncios.controller');
const { isAdmin, isTutor } = require('../middlewares/auth.middleware');
const { uploadCsv, uploadImage, handleUploadError } = require('../middlewares/upload.middleware');
const { tutorValidator, tutorAppLoginValidator } = require('../middlewares/validator.middleware');

router.post('/app/login', tutorAppLoginValidator, controller.loginTutorApp);
router.post('/app/logout', isTutor, controller.logoutTutor);

router.get('/app/me', isTutor, controller.getTutorAppProfile);
router.put('/app/me', 
    isTutor, 
    uploadImage.single('imagen'), 
    handleUploadError, 
    controller.updateTutorAppProfile
);

router.get('/app/mis-alumnos', isTutor, controller.getTutorAppAlumnos);
router.get('/app/alumno/:id', isTutor, controller.getTutorAppAlumnoDetalle);

router.get('/app/anuncios', isTutor, anunciosController.getAnunciosPortal);
router.get('/app/anuncios/urgentes', isTutor, anunciosController.getAnunciosUrgentes);

router.get('/', isAdmin, controller.getAllTutores);

router.post('/register-masivo', 
    isAdmin, 
    uploadCsv.single('csvFile'), 
    handleUploadError,
    controller.registerTutoresMasivo
);

router.post('/', 
    isAdmin, 
    uploadImage.single('imagen'), 
    handleUploadError,
    tutorValidator,
    controller.registerTutor
);

router.get('/:id', isAdmin, controller.getTutorById);

router.put('/:id', 
    isAdmin, 
    uploadImage.single('imagen'), 
    handleUploadError,
    controller.updateTutor
);

router.delete('/:id', isAdmin, controller.deleteTutor);

module.exports = router;