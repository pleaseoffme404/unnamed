const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');
const { saveImage, deleteImage } = require('./utils.controller');

const login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT u.*, p.nombre_completo, p.imagen_url 
            FROM usuarios u
            JOIN perfil_admin p ON u.id_usuario = p.id_usuario_fk
            WHERE u.correo_electronico = ?`, 
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const user = rows[0];

        if (user.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Esta plataforma es solo para administradores.' });
        }

        const isMatch = await bcrypt.compare(password, user.contrasena_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        req.session.autenticado = true;
        req.session.user = {
            id: user.id_usuario,
            correo: user.correo_electronico,
            rol: user.rol,
            nombre: user.nombre_completo,
            imagen: user.imagen_url
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            user: req.session.user
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const registerAdmin = async (req, res) => {
    const { nombre_completo, correo_electronico, telefono, contrasena } = req.body;
    let imageUrl = null;

    if (!nombre_completo || !correo_electronico || !contrasena) {
        return res.status(400).json({ success: false, message: 'Nombre, correo y contraseña son requeridos.' });
    }

    let connection;
    try {
        if (req.file) {
            imageUrl = await saveImage(req.file, 'admins', nombre_completo);
        }
        
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        const [userResult] = await connection.query(
            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "admin")',
            [correo_electronico, contrasena_hash, telefono]
        );

        const newUserId = userResult.insertId;

        await connection.query(
            'INSERT INTO perfil_admin (id_usuario_fk, nombre_completo, imagen_url) VALUES (?, ?, ?)',
            [newUserId, nombre_completo, imageUrl]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Administrador creado exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        if (imageUrl) await deleteImage(imageUrl); 

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'El correo electrónico o teléfono ya están registrados.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente.' });
    });
};

const checkAuth = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT p.nombre_completo, p.imagen_url 
            FROM perfil_admin p 
            WHERE p.id_usuario_fk = ?`,
            [req.session.user.id]
        );

        if (rows.length > 0) {
            req.session.user.nombre = rows[0].nombre_completo;
            req.session.user.imagen = rows[0].imagen_url;
        }

        res.status(200).json({
            success: true,
            autenticado: true,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const forgotPassword = async (req, res) => {
    const { correo_electronico } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [users] = await connection.query('SELECT id_usuario FROM usuarios WHERE correo_electronico = ?', [correo_electronico]);

        if (users.length === 0) {
            return res.status(200).json({ success: true, message: 'Si existe una cuenta, se enviará un correo de recuperación.' });
        }

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        const expira = new Date(Date.now() + 3600000);

        await connection.query('DELETE FROM password_reset_tokens WHERE id_usuario_fk = ?', [user.id_usuario]);
        await connection.query(
            'INSERT INTO password_reset_tokens (id_usuario_fk, token, expira_en) VALUES (?, ?, ?)',
            [user.id_usuario, tokenHash, expira]
        );

        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
        const emailHtml = `<p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p><a href="${resetLink}">${resetLink}</a>`;

        await sendEmail(correo_electronico, 'Restablecimiento de Contraseña', emailHtml);

        res.status(200).json({ success: true, message: 'Si existe una cuenta, se enviará un correo de recuperación.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const resetPassword = async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
        return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [tokens] = await connection.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND expira_en > NOW()',
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Token inválido o expirado.' });
        }

        const tokenData = tokens[0];
        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(nuevaContrasena, salt);

        await connection.query(
            'UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?',
            [contrasena_hash, tokenData.id_usuario_fk]
        );

        await connection.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenData.id]);

        await connection.commit();
        res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    login,
    registerAdmin,
    logout,
    checkAuth,
    forgotPassword,
    resetPassword
};