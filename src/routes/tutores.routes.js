const express = require('express');
const router = express.Router();
const controller = require('../controllers/tutores.controller');
const { isAdmin, isTutor } = require('../middlewares/auth.middleware');
const { uploadCsv, uploadImage, handleUploadError } = require('../middlewares/upload.middleware');
const { tutorValidator, tutorAppLoginValidator } = require('../middlewares/validator.middleware');

router.get('/', isAdmin, controller.getAllTutores);
router.get('/:id', isAdmin, controller.getTutorById);

router.post('/', 
    isAdmin, 
    uploadImage.single('imagen'), 
    handleUploadError,
    tutorValidator,
    controller.registerTutor
);

router.put('/:id', 
    isAdmin, 
    uploadImage.single('imagen'), 
    handleUploadError,
    controller.updateTutor
);

router.delete('/:id', isAdmin, controller.deleteTutor);

router.post('/register-masivo', 
    isAdmin, 
    uploadCsv.single('csvFile'), 
    handleUploadError,
    controller.registerTutoresMasivo
);

router.post('/app/login', tutorAppLoginValidator, controller.loginTutorApp);
router.get('/app/me', isTutor, controller.getTutorAppProfile);
router.get('/app/mis-alumnos', isTutor, controller.getTutorAppAlumnos);
router.post('/app/logout', isTutor, controller.logoutTutor);

module.exports = router;