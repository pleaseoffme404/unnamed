const express = require('express');
const router = express.Router();
const controller = require('../controllers/tutores.controller');
const { isAdmin } = require('../middlewares/auth.middleware');
const { uploadCsv, uploadImage } = require('../middlewares/upload.middleware');

router.get('/', isAdmin, controller.getAllTutores);
router.get('/:id', isAdmin, controller.getTutorById);
router.post('/', isAdmin, uploadImage.single('imagen'), controller.registerTutor);
router.put('/:id', isAdmin, uploadImage.single('imagen'), controller.updateTutor);
router.delete('/:id', isAdmin, controller.deleteTutor);

router.post('/register-masivo', isAdmin, uploadCsv.single('csvFile'), controller.registerTutoresMasivo);

module.exports = router;