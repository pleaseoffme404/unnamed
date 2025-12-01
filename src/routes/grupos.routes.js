const express = require('express');
const router = express.Router();
const controller = require('../controllers/grupos.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

router.get('/', isAdmin, controller.getAllGrupos);
router.get('/:id', isAdmin, controller.getGrupoById);
router.post('/', isAdmin, controller.createGrupo);
router.put('/:id', isAdmin, controller.updateGrupo);
router.delete('/:id', isAdmin, controller.deleteGrupo);

module.exports = router;