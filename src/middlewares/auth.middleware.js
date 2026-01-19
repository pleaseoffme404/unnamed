const jwt = require('jsonwebtoken');
const pool = require('../services/db.service');

const isAuthenticated = async (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        if (!token || token === 'null') {
            return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
        }

        try {
            const secret = process.env.JWT_SECRET || 'tu_super_secreto_escolar';
            const decoded = jwt.verify(token, secret);

            req.user = decoded;
            return next();

        } catch (error) {
            console.error('[AUTH] Token inválido:', error.message);
            return res.status(401).json({ success: false, message: 'Sesión expirada o inválida.' });
        }
    }

    return res.status(401).json({ success: false, message: 'No autorizado. Inicie sesión.' });
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.kiosk_locked) {
        const currentUrl = req.originalUrl || req.url;
        const allowedRoutes = ['/kiosk/unlock', '/api/qr/', '/api/alumnos', '/api/asistencia/'];
        const isAllowed = allowedRoutes.some(route => currentUrl.includes(route));

        if (!isAllowed) {
            return res.status(403).json({ success: false, message: 'Sesión bloqueada en modo Kiosco.' });
        }
    }

    const role = (req.session && req.session.user) ? req.session.user.rol : (req.user ? req.user.rol : null);

    if (role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Requiere permisos de administrador.' });
};

const isTutor = (req, res, next) => {
    const role = (req.session && req.session.user) ? req.session.user.rol : (req.user ? req.user.rol : null);
    
    if (role === 'tutor') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Tutor.' });
};

module.exports = {
    isAuthenticated,
    isTutor,
    isAdmin
};