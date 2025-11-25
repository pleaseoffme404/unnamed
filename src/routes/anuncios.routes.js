const express = require('express');
const router = express.Router();
const controller = require('../controllers/anuncios.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

router.get('/', isAdmin, controller.getAllAnuncios);
router.get('/:id', isAdmin, controller.getAnuncioById);
router.post('/', isAdmin, controller.createAnuncio);
router.put('/:id', isAdmin, controller.updateAnuncio);
router.delete('/:id', isAdmin, controller.deleteAnuncio);

module.exports = router;