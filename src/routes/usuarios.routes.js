const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

router.get('/', isAdmin, controller.getAllAdmins);
router.delete('/:id', isAdmin, controller.deleteAdmin);

module.exports = router;