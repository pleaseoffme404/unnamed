const pool = require('../services/db.service');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM Usuarios WHERE username = ? OR correo = ?', [user, user]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const adminUser = rows[0];

        const isMatch = await bcrypt.compare(password, adminUser.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        req.session.autenticado = true;
        req.session.user = {
            id: adminUser.id,
            username: adminUser.username,
            correo: adminUser.correo
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            user: req.session.user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

const register = async (req, res) => {
    const { username, password, correo } = req.body;

    if (!username || !password || !correo) {
        return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO Usuarios (username, correo, password_hash) VALUES (?, ?, ?)',
            [username, correo, password_hash]
        );

        res.status(201).json({ success: true, message: 'Usuario administrador creado exitosamente.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'El usuario o el email ya están registrados.' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
        }
        res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente.' });
    });
};

const checkAuth = (req, res) => {
    if (req.session.autenticado && req.session.user) {
        res.status(200).json({
            success: true,
            autenticado: true,
            user: req.session.user
        });
    } else {
        res.status(200).json({
            success: true,
            autenticado: false
        });
    }
};

module.exports = {
    login,
    register,
    logout,
    checkAuth
};