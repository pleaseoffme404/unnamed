const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    
    if (req.accepts('html')) {
        return res.redirect('/'); 
    }
    
    res.status(401).json({ message: 'Acceso no autorizado. Debes iniciar sesión.' });
};

module.exports = {
    isAuthenticated
};