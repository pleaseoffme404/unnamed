const express = require('express');
const router = express.Router();
const controller = require('../controllers/anuncios.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

router.post('/', isAdmin, controller.createAnuncio);
router.get('/', isAdmin, controller.getAllAnuncios);
router.put('/:id', isAdmin, controller.updateAnuncio);
router.delete('/:id', isAdmin, controller.deleteAnuncio);

module.exports = router;