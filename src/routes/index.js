const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const alumnosRoutes = require('./alumnos.routes');
const tutoresRoutes = require('./tutores.routes');
const vehiculosRoutes = require('./vehiculos.routes');
const anunciosRoutes = require('./anuncios.routes');
const asistenciaRoutes = require('./asistencia.routes');
const usuariosRoutes = require('./usuarios.routes');
const statsRoutes = require('./stats.routes');
const qrRoutes = require('./qr.routes'); 

router.use('/auth', authRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/tutores', tutoresRoutes);
router.use('/vehiculos', vehiculosRoutes);
router.use('/anuncios', anunciosRoutes);
router.use('/asistencia', asistenciaRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/stats', statsRoutes);
router.use('/qr', qrRoutes); 

module.exports = router;