const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { saveImage, deleteImage } = require('./utils.controller');

const registerTutor = async (req, res) => {
    const { 
        correo_electronico, telefono, contrasena,
        nombres, apellido_paterno, apellido_materno, notificaciones
    } = req.body;

    let imageUrl = null;

    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno || !telefono) {
        return res.status(400).json({ success: false, message: 'Correo, contraseña, nombre, apellido y teléfono son requeridos.' });
    }

    let connection;
    try {
        if (req.file) {
            imageUrl = await saveImage(req.file, 'tutores', `${nombres} ${apellido_paterno}`);
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        const [userResult] = await connection.query(
            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
            [correo_electronico, contrasena_hash, telefono]
        );

        const newUserId = userResult.insertId;

        await connection.query(
            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [newUserId, nombres, apellido_paterno, apellido_materno, notificaciones || 'correo', imageUrl]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Tutor registrado exitosamente', userId: newUserId });

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

const getAllTutores = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                p.id_perfil_tutor, p.nombres, p.apellido_paterno, p.apellido_materno, p.notificaciones, p.imagen_url,
                u.id_usuario, u.correo_electronico, u.telefono, u.esta_activo
            FROM perfil_tutor p
            JOIN usuarios u ON p.id_usuario_fk = u.id_usuario
            ORDER BY p.apellido_paterno, p.apellido_materno, p.nombres`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
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
            `SELECT 
                p.*,
                u.correo_electronico, u.telefono, u.esta_activo
            FROM perfil_tutor p
            JOIN usuarios u ON p.id_usuario_fk = u.id_usuario
            WHERE p.id_perfil_tutor = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tutor no encontrado.' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateTutor = async (req, res) => {
    const { id } = req.params;
    const { 
        correo_electronico, telefono, esta_activo,
        nombres, apellido_paterno, apellido_materno, notificaciones, contrasena,
        imagen_url_actual
    } = req.body;

    let connection;
    let newImageUrl = imagen_url_actual || null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [perfilRows] = await connection.query('SELECT id_usuario_fk FROM perfil_tutor WHERE id_perfil_tutor = ?', [id]);
        if (perfilRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Tutor no encontrado.' });
        }
        const id_usuario = perfilRows[0].id_usuario_fk;

        if (req.file) {
            newImageUrl = await saveImage(req.file, 'tutores', `${nombres} ${apellido_paterno}`);
            if (imagen_url_actual) {
                await deleteImage(imagen_url_actual);
            }
        } else if (imagen_url_actual === 'null' || imagen_url_actual === null) {
            await deleteImage(imagen_url_actual);
            newImageUrl = null;
        }

        await connection.query(
            `UPDATE perfil_tutor SET 
                nombres = ?, apellido_paterno = ?, apellido_materno = ?, notificaciones = ?, imagen_url = ?
            WHERE id_perfil_tutor = ?`,
            [nombres, apellido_paterno, apellido_materno, notificaciones, newImageUrl, id]
        );

        await connection.query(
            `UPDATE usuarios SET 
                correo_electronico = ?, telefono = ?, esta_activo = ?
            WHERE id_usuario = ?`,
            [correo_electronico, telefono, esta_activo, id_usuario]
        );

        if (contrasena && contrasena.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const contrasena_hash = await bcrypt.hash(contrasena, salt);
            await connection.query(
                'UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?',
                [contrasena_hash, id_usuario]
            );
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Tutor actualizado exitosamente.', imagen_url: newImageUrl });

    } catch (error) {
        if (connection) await connection.rollback();
        if (req.file) await deleteImage(newImageUrl);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'El correo electrónico o teléfono ya están registrados por otro usuario.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const deleteTutor = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [perfilRows] = await connection.query('SELECT id_usuario_fk, imagen_url FROM perfil_tutor WHERE id_perfil_tutor = ?', [id]);
        if (perfilRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tutor no encontrado.' });
        }
        const id_usuario = perfilRows[0].id_usuario_fk;
        const imageUrl = perfilRows[0].imagen_url;

        await connection.query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        
        if (imageUrl) {
            await deleteImage(imageUrl);
        }

        res.status(200).json({ success: true, message: 'Tutor eliminado exitosamente (eliminación en cascada).' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const registerTutoresMasivo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo CSV.' });
    }

    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());
    const tutores = [];
    let processingErrors = [];

    stream
        .pipe(csv())
        .on('data', (row) => {
            tutores.push(row);
        })
        .on('end', async () => {
            let connection;
            try {
                connection = await pool.getConnection();
                let count = 0;
                
                for (const [index, tutor] of tutores.entries()) {
                    const { 
                        correo_electronico, telefono, contrasena,
                        nombres, apellido_paterno, apellido_materno, notificaciones
                    } = tutor;

                    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno || !telefono) {
                        processingErrors.push({ fila: index + 2, error: 'Correo, contraseña, nombre, apellido y teléfono son requeridos.' });
                        continue;
                    }

                    try {
                        await connection.beginTransaction();

                        const salt = await bcrypt.genSalt(10);
                        const contrasena_hash = await bcrypt.hash(contrasena, salt);

                        const [userResult] = await connection.query(
                            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
                            [correo_electronico, contrasena_hash, telefono]
                        );

                        const newUserId = userResult.insertId;

                        await connection.query(
                            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones, imagen_url) VALUES (?, ?, ?, ?, ?, NULL)',
                            [newUserId, nombres, apellido_paterno, apellido_materno, notificaciones || 'correo']
                        );

                        await connection.commit();
                        count++;
                    } catch (error) {
                        await connection.rollback();
                        let errorMsg = 'Error en la base de datos.';
                        if (error.code === 'ER_DUP_ENTRY') {
                            errorMsg = 'El correo o teléfono ya existen.';
                        }
                        processingErrors.push({ fila: index + 2, data: tutor, error: errorMsg });
                    }
                }

                res.status(201).json({
                    success: true,
                    message: `Proceso completado. ${count} tutores registrados. ${processingErrors.length} errores.`,
                    errores: processingErrors
                });

            } catch (error) {
                res.status(500).json({ success: false, message: 'Error interno del servidor durante la carga masiva.' });
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