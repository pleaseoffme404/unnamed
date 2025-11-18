const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const alumnosRoutes = require('./alumnos.routes');

router.use(authRoutes);
router.use(alumnosRoutes); 

module.exports = router;