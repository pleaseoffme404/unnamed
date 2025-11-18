const isAuthenticated = (req, res, next) => {
    if (req.session.autenticado && req.session.user) {
        return next();
    }
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
         return res.status(401).json({ success: false, message: 'No autorizado. Debes iniciar sesión.' });
    }

    res.redirect('/');
};

module.exports = {
    isAuthenticated
};