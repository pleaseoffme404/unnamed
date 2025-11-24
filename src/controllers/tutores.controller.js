const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { saveImage, deleteImage } = require('./utils.controller');

const registerTutor = async (req, res) => {
    const { 
        nombres, apellido_paterno, apellido_materno, 
        correo_electronico, telefono, contrasena, notificaciones 
    } = req.body;

    let imageUrl = null;

    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    let connection;
    try {
        if (req.file) {
            imageUrl = await saveImage(req.file, 'tutores', `${nombres} ${apellido_paterno}`);
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contrasena, salt);

        const [userRes] = await connection.query(
            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
            [correo_electronico, hash, telefono]
        );

        await connection.query(
            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [userRes.insertId, nombres, apellido_paterno, apellido_materno, notificaciones || 'correo', imageUrl]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Tutor registrado exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        if (imageUrl) await deleteImage(imageUrl);
        res.status(500).json({ success: false, message: error.code === 'ER_DUP_ENTRY' ? 'Correo o teléfono ya registrados.' : 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const getAllTutores = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                t.id_perfil_tutor, t.nombres, t.apellido_paterno, t.apellido_materno, 
                t.imagen_url, t.notificaciones,
                u.id_usuario, u.correo_electronico, u.telefono, u.esta_activo,
                (SELECT COUNT(*) FROM alumnos_tutores at WHERE at.id_perfil_tutor_fk = t.id_perfil_tutor) as total_alumnos
            FROM perfil_tutor t
            JOIN usuarios u ON t.id_usuario_fk = u.id_usuario
            ORDER BY t.apellido_paterno, t.nombres`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const getTutorById = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT t.*, u.correo_electronico, u.telefono, u.esta_activo
            FROM perfil_tutor t
            JOIN usuarios u ON t.id_usuario_fk = u.id_usuario
            WHERE t.id_perfil_tutor = ?`,
            [id]
        );
        
        if (rows.length === 0) return res.status(404).json({ success: false });
        
        const [alumnos] = await connection.query(
            `SELECT a.nombres, a.apellido_paterno, a.curp 
             FROM perfil_alumno a
             JOIN alumnos_tutores rel ON a.id_perfil_alumno = rel.id_perfil_alumno_fk
             WHERE rel.id_perfil_tutor_fk = ?`, 
             [id]
        );
        
        const data = rows[0];
        data.alumnos_lista = alumnos;
        
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const updateTutor = async (req, res) => {
    const { id } = req.params;
    const { 
        nombres, apellido_paterno, apellido_materno, 
        correo_electronico, telefono, contrasena, notificaciones, esta_activo, 
        imagen_url_actual 
    } = req.body;

    let connection;
    let newImageUrl = imagen_url_actual || null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT id_usuario_fk FROM perfil_tutor WHERE id_perfil_tutor = ?', [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false });
        }
        const id_usuario = rows[0].id_usuario_fk;

        if (req.file) {
            newImageUrl = await saveImage(req.file, 'tutores', `${nombres} ${apellido_paterno}`);
            if (imagen_url_actual) await deleteImage(imagen_url_actual);
        }

        await connection.query(
            `UPDATE perfil_tutor SET nombres=?, apellido_paterno=?, apellido_materno=?, notificaciones=?, imagen_url=? WHERE id_perfil_tutor=?`,
            [nombres, apellido_paterno, apellido_materno, notificaciones, newImageUrl, id]
        );

        await connection.query(
            `UPDATE usuarios SET correo_electronico=?, telefono=?, esta_activo=? WHERE id_usuario=?`,
            [correo_electronico, telefono, esta_activo, id_usuario]
        );

        if (contrasena && contrasena.trim()) {
            const hash = await bcrypt.hash(contrasena, 10);
            await connection.query('UPDATE usuarios SET contrasena_hash=? WHERE id_usuario=?', [hash, id_usuario]);
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Actualizado correctamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Error al actualizar.' });
    } finally {
        if (connection) connection.release();
    }
};

const deleteTutor = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id_usuario_fk, imagen_url FROM perfil_tutor WHERE id_perfil_tutor = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false });

        await connection.query('DELETE FROM usuarios WHERE id_usuario = ?', [rows[0].id_usuario_fk]);
        if (rows[0].imagen_url) await deleteImage(rows[0].imagen_url);

        res.status(200).json({ success: true, message: 'Eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const registerTutoresMasivo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió archivo.' });
    }

    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());
    const tutores = [];
    let processingErrors = [];

    stream
        .pipe(csv())
        .on('data', (row) => tutores.push(row))
        .on('end', async () => {
            let connection;
            try {
                connection = await pool.getConnection();
                let count = 0;
                
                for (const [index, tutor] of tutores.entries()) {
                    const { correo_electronico, telefono, contrasena, nombres, apellido_paterno, apellido_materno, notificaciones } = tutor;

                    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno || !telefono) {
                        processingErrors.push({ fila: index + 2, error: 'Faltan datos.' });
                        continue;
                    }

                    try {
                        await connection.beginTransaction();
                        const hash = await bcrypt.hash(contrasena, 10);

                        const [userRes] = await connection.query(
                            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
                            [correo_electronico, hash, telefono]
                        );

                        await connection.query(
                            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones, imagen_url) VALUES (?, ?, ?, ?, ?, NULL)',
                            [userRes.insertId, nombres, apellido_paterno, apellido_materno, notificaciones || 'correo']
                        );

                        await connection.commit();
                        count++;
                    } catch (error) {
                        await connection.rollback();
                        processingErrors.push({ fila: index + 2, error: error.code === 'ER_DUP_ENTRY' ? 'Duplicado' : 'Error BD' });
                    }
                }

                res.status(201).json({
                    success: true,
                    message: `Registrados: ${count}. Errores: ${processingErrors.length}.`,
                    errores: processingErrors
                });

            } catch (error) {
                res.status(500).json({ success: false, message: 'Error masivo.' });
            } finally {
                if (connection) connection.release();
            }
        });
};

module.exports = {
    registerTutor,
    getAllTutores,
    getTutorById,
    updateTutor,
    deleteTutor,
    registerTutoresMasivo
};