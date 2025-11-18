const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../middlewares/upload.middleware');

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/check', isAuthenticated, controller.checkAuth);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.post('/register-admin', isAuthenticated, isAdmin, uploadImage.single('imagen'), controller.registerAdmin);

module.exports = router;