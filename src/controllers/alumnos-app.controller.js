const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const { saveImage, deleteImage } = require('./utils.controller');

const getMiPerfil = async (req, res) => {
    const idUsuario = req.user.id_usuario;
    
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [alumno] = await connection.query(
            `SELECT p.*, u.correo_electronico, u.telefono, g.hora_entrada, g.hora_salida
             FROM perfil_alumno p
             JOIN usuarios u ON p.id_usuario_fk = u.id_usuario
             LEFT JOIN grupos_disponibles g ON p.grado = g.grado AND p.grupo = g.grupo
             WHERE p.id_usuario_fk = ?`,
            [idUsuario]
        );

        if (alumno.length === 0) return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });

        const idPerfil = alumno[0].id_perfil_alumno;

        const [vehiculo] = await connection.query('SELECT * FROM vehiculos WHERE id_perfil_alumno_fk = ?', [idPerfil]);
        
        const [asistencias] = await connection.query(
            'SELECT fecha_hora_entrada, fecha_hora_salida, estatus, metodo_entrada FROM asistencia WHERE id_perfil_alumno_fk = ? ORDER BY fecha_hora_entrada DESC LIMIT 20',
            [idPerfil]
        );

        res.status(200).json({
            success: true,
            data: {
                perfil: alumno[0],
                vehiculo: vehiculo.length > 0 ? vehiculo[0] : null,
                historial: asistencias
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateMiVehiculo = async (req, res) => {
    const idUsuario = req.user.id_usuario;
    const { tipo, descripcion } = req.body;

    if (!tipo || !descripcion) return res.status(400).json({ success: false, message: 'Faltan datos del vehículo.' });

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [alumno] = await connection.query('SELECT id_perfil_alumno FROM perfil_alumno WHERE id_usuario_fk = ?', [idUsuario]);
        if (alumno.length === 0) return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
        
        const idPerfil = alumno[0].id_perfil_alumno;

        const [vehiculoExistente] = await connection.query('SELECT id_vehiculo, imagen_url FROM vehiculos WHERE id_perfil_alumno_fk = ?', [idPerfil]);
        
        let imageUrl = vehiculoExistente.length > 0 ? vehiculoExistente[0].imagen_url : null;

        if (req.file) {
            if (imageUrl) await deleteImage(imageUrl);
            imageUrl = await saveImage(req.file, 'vehiculos', `${idPerfil}_auto`);
        }

        if (vehiculoExistente.length > 0) {
            await connection.query(
                'UPDATE vehiculos SET tipo = ?, descripcion = ?, imagen_url = ? WHERE id_vehiculo = ?',
                [tipo, descripcion, imageUrl, vehiculoExistente[0].id_vehiculo]
            );
            res.status(200).json({ success: true, message: 'Vehículo actualizado.', imagen_url: imageUrl });
        } else {
            await connection.query(
                'INSERT INTO vehiculos (id_perfil_alumno_fk, tipo, descripcion, imagen_url) VALUES (?, ?, ?, ?)',
                [idPerfil, tipo, descripcion, imageUrl]
            );
            res.status(201).json({ success: true, message: 'Vehículo registrado.', imagen_url: imageUrl });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al guardar vehículo.' });
    } finally {
        if (connection) connection.release();
    }
};

const cambiarPassword = async (req, res) => {
    const idUsuario = req.user.id_usuario;
    const { oldPassword, newPassword } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [user] = await connection.query('SELECT contrasena_hash FROM usuarios WHERE id_usuario = ?', [idUsuario]);
        if (user.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });

        const isMatch = await bcrypt.compare(oldPassword, user[0].contrasena_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await connection.query('UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?', [hash, idUsuario]);

        res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getMiPerfil,
    updateMiVehiculo,
    cambiarPassword
};