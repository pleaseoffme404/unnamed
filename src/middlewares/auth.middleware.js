const pool = require('../services/db.service');

const isAuthenticated = async (req, res, next) => {
    console.log('AUTH Verificando acceso...');

    if (req.session && req.session.user) {
        console.log('AUTH Acceso Web Permitido (Cookie)');
        req.user = req.session.user;
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            console.log('AUTH Token vacio.');
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
                console.log('AUTH Token invalido o caducado.');
                return res.status(401).json({ success: false, message: 'Sesion no valida.' });
            }

            const user = rows[0];
            if (!user.esta_activo) {
                console.log('AUTH Cuenta desactivada.');
                return res.status(403).json({ success: false, message: 'Cuenta desactivada.' });
            }

            console.log('AUTH Acceso Movil Permitido (Token)');
            req.user = user;
            return next();

        } catch (error) {
            console.error('AUTH Error DB:', error);
            return res.status(500).json({ success: false, message: 'Error de autenticacion.' });
        }
    }

    console.log('AUTH Rechazado: Ni cookie ni token encontrados.');
    return res.status(401).json({ success: false, message: 'No autorizado. Sesion requerida.' });
};

const isAdmin = (req, res, next) => {
    const role = (req.session && req.session.user) ? req.session.user.rol : (req.user ? req.user.rol : null);

    if (role === 'admin') {
        return next();
    }
    console.log('AUTH Acceso denegado: Se requiere Admin.');
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