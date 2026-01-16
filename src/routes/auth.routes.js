const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { uploadImage, handleUploadError } = require('../middlewares/upload.middleware');
const { loginValidator, loginMobileValidator } = require('../middlewares/validator.middleware');

router.post('/login', loginValidator, controller.login);
router.post('/login-mobile', loginMobileValidator, controller.loginMobile);
router.post('/login-phone', controller.loginPhone);
router.get('/verificar', controller.verificar);
router.post('/logout', controller.logout);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.post('/send-code', controller.sendEmailCode);
router.post('/verify-code', controller.verifyEmailCode);

router.post('/register-admin', 
    isAuthenticated, 
    isAdmin, 
    uploadImage.single('imagen'), 
    handleUploadError, 
    controller.registerAdmin
);


router.post('/kiosk/lock', isAuthenticated, isAdmin, controller.lockKioskSession);
router.post('/kiosk/unlock', isAuthenticated, isAdmin, controller.unlockKioskSession);

module.exports = router;