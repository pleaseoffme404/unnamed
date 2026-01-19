const pool = require('./../services/db.service');
const { saveImage, deleteImage } = require('./utils.controller');

const createVehiculo = async (req, res) => {
    const { id_perfil_alumno_fk, tipo, descripcion } = req.body;
    let imageUrl = null;

    if (!id_perfil_alumno_fk || !tipo) {
        return res.status(400).json({ success: false, message: 'El ID del alumno y el tipo de vehículo son requeridos.' });
    }

    let connection;
    try {
        if (req.file) {
            imageUrl = await saveImage(req.file, 'vehiculos', tipo);
        }

        connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO vehiculos (id_perfil_alumno_fk, tipo, descripcion, imagen_url) VALUES (?, ?, ?, ?)',
            [id_perfil_alumno_fk, tipo, descripcion, imageUrl]
        );
        res.status(201).json({ success: true, message: 'Vehículo registrado.', id: result.insertId });
    } catch (error) {
        if (imageUrl) await deleteImage(imageUrl);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const getVehiculosByAlumno = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM vehiculos WHERE id_perfil_alumno_fk = ?',
            [id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateVehiculo = async (req, res) => {
    const { id } = req.params;
    const { tipo, descripcion, imagen_url_actual } = req.body;
    let newImageUrl = imagen_url_actual || null;
    let connection;

    try {
        connection = await pool.getConnection();

        if (req.file) {
            newImageUrl = await saveImage(req.file, 'vehiculos', tipo);
            if (imagen_url_actual) {
                await deleteImage(imagen_url_actual);
            }
        } else if (imagen_url_actual === 'null' || imagen_url_actual === null) {
            if (imagen_url_actual) await deleteImage(imagen_url_actual);
            newImageUrl = null;
        }
        
        const [result] = await connection.query(
            'UPDATE vehiculos SET tipo = ?, descripcion = ?, imagen_url = ? WHERE id_vehiculo = ?',
            [tipo, descripcion, newImageUrl, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Vehículo actualizado.', imagen_url: newImageUrl });
    } catch (error) {
        if (req.file) await deleteImage(newImageUrl);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const deleteVehiculo = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query('SELECT imagen_url FROM vehiculos WHERE id_vehiculo = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado.' });
        }
        
        const imageUrl = rows[0].imagen_url;

        const [result] = await connection.query(
            'DELETE FROM vehiculos WHERE id_vehiculo = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado.' });
        }

        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        res.status(200).json({ success: true, message: 'Vehículo eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const obtenerMisVehiculos = async (req, res) => {
    // Obtenemos el ID del usuario desde el token (req.user)
    const idUsuario = req.user.id_usuario;

    let connection;
    try {
        connection = await pool.getConnection();
        // Hacemos JOIN para llegar a los vehículos desde el usuario
        const [rows] = await connection.query(
            `SELECT v.id_vehiculo, v.tipo, v.descripcion, v.imagen_url
             FROM vehiculos v
             JOIN perfil_alumno p ON v.id_perfil_alumno_fk = p.id_perfil_alumno
             WHERE p.id_usuario_fk = ?
             ORDER BY v.fecha_registro DESC`,
            [idUsuario]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

// --- NUEVA FUNCIÓN PARA MÓVIL (POST) ---
const registrarMiVehiculo = async (req, res) => {
    const idUsuario = req.user.id_usuario;
    const { tipo, descripcion } = req.body;

    if (!tipo || !descripcion) {
        return res.status(400).json({ success: false, message: 'Faltan datos' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Buscar el perfil de alumno asociado a este usuario
        const [alumno] = await connection.query(
            'SELECT id_perfil_alumno FROM perfil_alumno WHERE id_usuario_fk = ?', 
            [idUsuario]
        );

        if (alumno.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil de alumno no encontrado' });
        }

        const idAlumno = alumno[0].id_perfil_alumno;

        // 2. Insertar el vehículo (Sin imagen por ahora para simplificar el móvil)
        await connection.query(
            'INSERT INTO vehiculos (id_perfil_alumno_fk, tipo, descripcion) VALUES (?, ?, ?)',
            [idAlumno, tipo, descripcion]
        );

        res.status(201).json({ success: true, message: 'Vehículo registrado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al registrar' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createVehiculo,
    getVehiculosByAlumno,
    updateVehiculo,
    deleteVehiculo,
    obtenerMisVehiculos,
    registrarMiVehiculo
};