const pool = require('../services/db.service');

const isAuthenticated = async (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token no proporcionado.' });
        }

        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.query(
                'SELECT id_usuario, rol, esta_activo, correo_electronico FROM usuarios WHERE token_sesion_actual = ?',
                [token]
            );
            connection.release();

            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Sesion no valida.' });
            }

            const user = rows[0];
            if (!user.esta_activo) {
                return res.status(403).json({ success: false, message: 'Cuenta desactivada.' });
            }

            req.user = user;
            return next();

        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error de autenticacion.' });
        }
    }

    return res.status(401).json({ success: false, message: 'No autorizado. Sesion requerida.' });
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.kiosk_locked) {
        const currentUrl = req.originalUrl || req.url;
        
        const allowedRoutes = [
            '/kiosk/unlock',      
            '/api/qr/',            
            '/api/alumnos',        
            '/api/asistencia/'     
        ];

        const isAllowed = allowedRoutes.some(route => currentUrl.includes(route));

        if (!isAllowed) {
            return res.status(403).json({ success: false, message: 'Sesion bloqueada en modo Kiosco.' });
        }
    }

    const role = (req.session && req.session.user) ? req.session.user.rol : (req.user ? req.user.rol : null);

    if (role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Requiere permisos de administrador.' });
};

const isTutor = (req, res, next) => {
    if (req.session && req.session.rol === 'tutor') {
        return next();
    }

    if (req.session && req.session.user && req.session.user.rol === 'tutor') {
        return next();
    }

    if (req.user && req.user.rol === 'tutor') {
        return next();
    }

    return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Tutor.' });
};

module.exports = {
    isAuthenticated,
    isTutor,
    isAdmin
};