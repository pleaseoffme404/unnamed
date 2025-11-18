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
            return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
        }

        const isMatch = await bcrypt.compare(password, user.contrasena_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        req.session.user = {
            id: user.id_usuario,
            email: user.correo_electronico,
            rol: user.rol,
            nombre: user.nombre_completo,
            imagen: user.imagen_url
        };

        req.session.save(err => {
            if (err) {
                console.error('Error guardando sesión:', err);
                return res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
            }
            res.status(200).json({ 
                success: true, 
                message: 'Inicio de sesión exitoso.',
                user: req.session.user 
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const verificar = (req, res) => {
    if (req.session.user) {
        return res.json({
            success: true,
            autenticado: true,
            tipo: req.session.user.rol,
            usuario: req.session.user
        });
    } else {
        return res.json({
            success: true,
            autenticado: false
        });
    }
};

// --- Logout ---
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
        }
        res.clearCookie('sid_escolar'); 
        res.json({ success: true, message: 'Sesión cerrada.' });
    });
};


const registerAdmin = async (req, res) => {
    const { nombre_completo, correo_electronico, telefono, contrasena } = req.body;
    let imageUrl = null;

    if (!nombre_completo || !correo_electronico || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
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
            return res.status(409).json({ success: false, message: 'El correo o teléfono ya existen.' });
        }
        res.status(500).json({ success: false, message: 'Error interno.' });
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
            return res.status(200).json({ success: true, message: 'Si existe una cuenta, se enviará un correo.' });
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

        const resetLink = `http://localhost:1000/reset-password?token=${token}`;
        const emailHtml = `<p>Para restablecer tu contraseña, haz clic aquí:</p><a href="${resetLink}">${resetLink}</a>`;

        await sendEmail(correo_electronico, 'Recuperar Contraseña', emailHtml);

        res.status(200).json({ success: true, message: 'Si existe una cuenta, se enviará un correo.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const resetPassword = async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
        return res.status(400).json({ success: false, message: 'Token y contraseña requeridos.' });
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
        res.status(200).json({ success: true, message: 'Contraseña actualizada.' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    login,
    verificar,
    logout,
    registerAdmin,
    forgotPassword,
    resetPassword
};