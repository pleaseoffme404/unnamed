const pool = require('../services/db.service');
const bcrypt = require('bcrypt');

const saltRounds = 10; 

exports.register = async (req, res) => {
    const { username, password, correo } = req.body;

    if (!username || !password || !correo) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const [result] = await pool.query(
            'INSERT INTO Usuarios (username, password_hash, correo) VALUES (?, ?, ?)',
            [username, passwordHash, correo]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente.', userId: result.insertId });

    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El nombre de usuario o correo ya existen.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM Usuarios WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        req.session.user = {
            id: user.id,
            username: user.username
        };

        res.status(200).json({ message: 'Login exitoso.', user: req.session.user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.reauthenticate = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'No hay sesión activa.' });
    }
    
    const { password } = req.body;
    const { username } = req.session.user;

    if (!password) {
        return res.status(400).json({ message: 'Contraseña requerida.' });
    }

    try {
        const [rows] = await pool.query('SELECT password_hash FROM Usuarios WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        res.status(200).json({ message: 'Verificación exitosa.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


exports.status = (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ loggedIn: false });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'No se pudo cerrar sesión.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
    });
};