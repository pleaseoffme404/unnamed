const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarCorreo, templates } = require('../services/email.service');
const { saveImage, deleteImage } = require('./utils.controller');
const firebaseAdmin = require('../services/firebase.service');
const jwt = require('jsonwebtoken');

// --- LOGIN WEB (ADMIN) ---
const login = async (req, res) => {
    const correo = req.body.correo || req.body.email;
    const { password } = req.body;

    console.log(`[LOGIN ADMIN] Intento para: ${correo}`);

    if (!correo || !password) {
        return res.status(400).json({ success: false, message: 'Ingrese correo y contraseña.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [rows] = await connection.query(
            `SELECT u.*, p.nombre_completo, p.imagen_url 
            FROM usuarios u
            LEFT JOIN perfil_admin p ON u.id_usuario = p.id_usuario_fk
            WHERE u.correo_electronico = ?`, 
            [correo]
        );

        if (rows.length === 0) {
            console.log('[LOGIN ADMIN] Usuario no encontrado en BD.');
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const user = rows[0];

        if (user.rol !== 'admin') {
            console.log(`[LOGIN ADMIN] Rol incorrecto: ${user.rol}`);
            return res.status(403).json({ success: false, message: 'No tienes permisos de administrador.' });
        }

        const isMatch = await bcrypt.compare(password, user.contrasena_hash);
        
        if (!isMatch) {
            console.log('[LOGIN ADMIN] Contraseña incorrecta.');
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        req.session.user = {
            id: user.id_usuario,
            id_usuario: user.id_usuario, 
            email: user.correo_electronico,
            rol: user.rol,
            nombre: user.nombre_completo || 'Administrador',
            imagen: user.imagen_url
        };

        req.session.save(err => {
            if (err) {
                console.error('[LOGIN ADMIN] Error guardando sesión:', err);
                return res.status(500).json({ success: false, message: 'Error de sesión.' });
            }
            console.log('[LOGIN ADMIN] Éxito. Sesión creada.');
            res.status(200).json({ success: true, message: 'Bienvenido.', user: req.session.user });
        });

    } catch (error) {
        console.error('[LOGIN ADMIN] Error interno:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

// --- LOGIN MÓVIL (ALUMNOS) ---
const loginMobile = async (req, res) => {
    const { boleta, password } = req.body;

    console.log(`[LOGIN MOVIL] Intento para boleta: ${boleta}`);

    if (!boleta || !password) {
        return res.status(400).json({ success: false, message: 'Faltan credenciales' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Join para obtener datos del alumno Y del usuario (contraseña)
        const [users] = await connection.query(
    `SELECT u.id_usuario, u.contrasena_hash, u.rol, u.codigo_verificacion_email, u.telefono_verificado,
            p.nombres, p.apellido_paterno, p.grupo, p.imagen_url, p.boleta
     FROM usuarios u
     JOIN perfil_alumno p ON u.id_usuario = p.id_usuario_fk
     WHERE p.boleta = ? AND u.rol = 'alumno'`, 
    [boleta]
);

        if (users.length === 0) {
            console.log('[LOGIN MOVIL] Usuario no encontrado.');
            return res.status(401).json({ success: false, message: 'Boleta no encontrada o no es alumno' });
        }

        const user = users[0];

        // Comparar contraseña encriptada (BCRYPT)
        const validPassword = await bcrypt.compare(password, user.contrasena_hash);

        if (!validPassword) {
            console.log('[LOGIN MOVIL] Password incorrecto.');
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Generar JWT real
        const tokenPayload = {
            id_usuario: user.id_usuario,
            boleta: boleta,
            rol: user.rol 
        };

        const token = jwt.sign(
            tokenPayload, 
            process.env.JWT_SECRET || 'tu_super_secreto_escolar', 
            { expiresIn: '30d' } 
        );

        console.log('[LOGIN MOVIL] Login exitoso. Token generado.');

        res.json({
    success: true,
    data: {
        token: token,
        alumno: { 
            nombre_completo: user.nombres + " " + user.apellido_paterno,
            boleta: user.boleta,
            grupo: user.grupo || "Sin grupo",
            foto: user.imagen_url || "", 
            carrera: "Técnico en Programación" 
        },
        verificaciones: {
            email: user.codigo_verificacion_email !== null || user.email_verificado === 1,
            telefono: user.telefono_verificado === 1
        }
    }
});

    } catch (error) {
        console.error('[LOGIN MOVIL ERROR]', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// --- ENVIAR CÓDIGO EMAIL ---
const sendEmailCode = async (req, res) => {
    console.log("🚩 [Paso 1] Inicio del controlador sendEmailCode");

    const idUsuario = req.user ? req.user.id_usuario : null;
    console.log(`🚩 [Paso 2] ID Usuario recibido del token: ${idUsuario}`);

    if (!idUsuario) {
        console.log("❌ [Error] No se encontró idUsuario en el req.user");
        return res.status(401).json({ success: false, message: 'Usuario no identificado.' });
    }

    let connection;
    try {
        console.log("🚩 [Paso 3] Intentando obtener conexión del Pool de Base de Datos...");
        connection = await pool.getConnection(); 
        console.log("🚩 [Paso 4] ¡Conexión a BD obtenida exitosamente!");

        console.log("🚩 [Paso 5] Consultando correo del usuario...");
        const [user] = await connection.query('SELECT correo_electronico FROM usuarios WHERE id_usuario = ?', [idUsuario]);
        
        console.log(`🚩 [Paso 6] Consulta finalizada. Registros encontrados: ${user.length}`);

        if(user.length === 0) {
            console.log("❌ [Error] Usuario no encontrado en la BD.");
            return res.status(404).json({success: false, message: 'Usuario no encontrado'});
        }

        const correo = user[0].correo_electronico;
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🚩 [Paso 7] Usuario válido: ${correo}. Generando código: ${codigo}`);

        console.log("🚩 [Paso 8] Guardando código en la Base de Datos...");
        await connection.query('UPDATE usuarios SET codigo_verificacion_email = ? WHERE id_usuario = ?', [codigo, idUsuario]);
        console.log("🚩 [Paso 9] Código guardado en BD.");

        const html = `
            <h3>Verificación de Cuenta</h3>
            <p>Tu código de verificación es:</p>
            <h1 style="color: #5865F2; letter-spacing: 5px;">${codigo}</h1>
            <p>Ingrésalo en la aplicación para continuar.</p>
        `;

        console.log("🚩 [Paso 10] Llamando a la función enviarCorreo (SMTP)...");
        await enviarCorreo(correo, 'Código de Verificación', html);
        
        console.log("🚩 [Paso 11] ¡enviarCorreo retornó éxito!");
        res.status(200).json({ success: true, message: 'Código enviado al correo.' });

    } catch (error) {
        console.error("❌ [ERROR CRÍTICO] Se rompió en el Catch:");
        console.error(error); 
        res.status(500).json({ success: false, message: 'Error interno: ' + error.message });
    } finally {
        if (connection) {
            console.log("🚩 [Paso 12] Liberando conexión de BD.");
            connection.release();
        } else {
            console.log("🚩 [Paso 12] No había conexión para liberar.");
        }
    }
};

// --- VERIFICAR CÓDIGO EMAIL ---
const verifyEmailCode = async (req, res) => {
    const idUsuario = req.user ? req.user.id_usuario : null;
    const { code } = req.body;

    if(!code) return res.status(400).json({success: false, message: 'Código requerido'});
    if (!idUsuario) return res.status(401).json({ success: false, message: 'Usuario no identificado.' });

    let connection;
    try {
        connection = await pool.getConnection();
        const [user] = await connection.query(
            'SELECT codigo_verificacion_email FROM usuarios WHERE id_usuario = ?', 
            [idUsuario]
        );

        if(user.length === 0) return res.status(404).json({success: false, message: 'Usuario no encontrado'});

        if(String(user[0].codigo_verificacion_email) !== String(code)) {
            return res.status(400).json({ success: false, message: 'Código incorrecto.' });
        }

        // Limpiamos el código y marcamos verificado (email_verificado = 1 es hipotético si tienes esa columna)
        // Como no tengo tu schema exacto de si tienes 'email_verificado', dejo el update standard:
        await connection.query(
            'UPDATE usuarios SET codigo_verificacion_email = NULL WHERE id_usuario = ?',
            [idUsuario]
        );

        res.status(200).json({ success: true, message: 'Correo verificado correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

// --- LOGIN TELEFONO (FIREBASE) ---
const loginPhone = async (req, res) => {
    const { idToken } = req.body; 
    if (!idToken) return res.status(400).json({ success: false, message: 'Falta token.' });

    let connection;
    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
        const phoneNumber = decodedToken.phone_number; 
        const telefonoLimpio = phoneNumber.slice(-10); 

        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT p.id_perfil_alumno, p.nombres, p.apellido_paterno, p.grupo, p.imagen_url, p.boleta,
                u.id_usuario, u.esta_activo
            FROM usuarios u
            JOIN perfil_alumno p ON u.id_usuario = p.id_usuario_fk
            WHERE u.telefono LIKE ? AND u.rol = 'alumno'`,
            [`%${telefonoLimpio}`]
        );

        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Teléfono no registrado.' });

        const alumno = rows[0];
        if (!alumno.esta_activo) return res.status(403).json({ success: false, message: 'Cuenta desactivada.' });

        // Ya no necesitamos sessionToken de texto, usamos JWT para móviles siempre
        // Pero mantenemos la lógica de actualizar el flag de verificado
        await connection.query(
            'UPDATE usuarios SET telefono_verificado = 1 WHERE id_usuario = ?', 
            [alumno.id_usuario]
        );

        res.status(200).json({ success: true, message: 'Verificado' });

    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: 'Error de autenticación.' });
    } finally {
        if (connection) connection.release();
    }
};

const verificar = (req, res) => {
    if (req.session.user) {
        return res.json({ success: true, autenticado: true, tipo: req.session.user.rol, usuario: req.session.user });
    }
    return res.json({ success: true, autenticado: false });
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sid_escolar'); 
        res.json({ success: true });
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
    const { correo } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [users] = await connection.query(
            'SELECT id_usuario, rol FROM usuarios WHERE correo_electronico = ?', 
            [correo]
        );
        
        if (users.length === 0) return res.status(200).json({ success: true, message: 'Si el correo existe, se han enviado las instrucciones.' });
        
        const userId = users[0].id_usuario;
        const token = crypto.randomBytes(32).toString('hex');
        const expireDate = new Date(Date.now() + 3600000);

        await connection.query('UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id_usuario = ?', [token, expireDate, userId]);

        const resetLink = `${process.env.APP_URL || 'http://localhost:1200'}/reset-password/index.html?token=${token}`;
        
        await enviarCorreo(correo, 'Restablecer Contraseña Admin', templates.recovery(resetLink, '#5865F2'));

        res.status(200).json({ success: true, message: 'Si el correo existe, se han enviado las instrucciones.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [users] = await connection.query('SELECT id_usuario FROM usuarios WHERE reset_token = ? AND reset_expires > NOW()', [token]);

        if (users.length === 0) return res.status(400).json({ success: false, message: 'Enlace inválido o expirado.' });

        const userId = users[0].id_usuario;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await connection.query('UPDATE usuarios SET contrasena_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id_usuario = ?', [hash, userId]);

        res.status(200).json({ success: true, message: 'Contraseña actualizada.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};


const lockKioskSession = (req, res) => {
    if (req.session) {
        req.session.kiosk_locked = true;
        req.session.save((err) => {
            if (err) {
                console.error('[AUTH KIOSK] Error al bloquear sesión:', err);
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ success: false, message: 'No hay sesión activa' });
    }
};

const unlockKioskSession = async (req, res) => {
    const { password } = req.body;
    
    if (!req.session.user || !req.session.user.id_usuario) {
        return res.status(401).json({ success: false, message: 'Sesión expirada' });
    }

    const userId = req.session.user.id_usuario;

    if (!password) {
        return res.status(400).json({ success: false, message: 'Falta contraseña' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT contrasena_hash FROM usuarios WHERE id_usuario = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(password, rows[0].contrasena_hash);

        if (isMatch) {
            req.session.kiosk_locked = false;
            req.session.save((err) => {
                if (err) {
                    console.error('[AUTH KIOSK] Error guardando sesión:', err);
                    return res.status(500).json({ success: false });
                }
                res.json({ success: true, message: 'Desbloqueado' });
            });
        } else {
            res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('[AUTH KIOSK] Error interno:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    login,
    loginMobile,
    loginPhone,
    sendEmailCode,
    verifyEmailCode,
    verificar,
    logout,
    registerAdmin,
    forgotPassword,
    resetPassword,
    lockKioskSession,
    unlockKioskSession
};