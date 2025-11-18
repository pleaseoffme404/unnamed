const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'No autorizado. Sesión requerida.' });
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado. Requiere permisos de administrador.' });
};

module.exports = {
    isAuthenticated,
    isAdmin
};