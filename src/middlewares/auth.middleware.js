const isAuthenticated = (req, res, next) => {
    if (req.session.autenticado && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'No autorizado. Debes iniciar sesión.' });
};

const isAdmin = (req, res, next) => {
    if (req.session.autenticado && req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado. Requiere permisos de administrador.' });
};

module.exports = {
    isAuthenticated,
    isAdmin
};