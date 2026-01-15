const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { saveImage, deleteImage } = require('./utils.controller');

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
            `SELECT a.id_perfil_alumno, a.nombres, a.apellido_paterno, a.curp 
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

const registerTutor = async (req, res) => {
    const { 
        nombres, apellido_paterno, apellido_materno, 
        correo_electronico, telefono, contrasena, notificaciones,
        alumnos 
    } = req.body;

    let imageUrl = null;

    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    let connection;
    try {
        if (req.file) imageUrl = await saveImage(req.file, 'tutores', `${nombres} ${apellido_paterno}`);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (alumnos) {
            const alumnosIds = Array.isArray(alumnos) ? alumnos : [alumnos];
            for (const alumnoId of alumnosIds) {
                if(alumnoId) {
                    const [count] = await connection.query(
                        'SELECT COUNT(*) as total FROM alumnos_tutores WHERE id_perfil_alumno_fk = ?',
                        [alumnoId]
                    );
                    if (count[0].total >= 2) {
                        throw new Error(`El alumno ID ${alumnoId} ya tiene el máximo de 2 tutores.`);
                    }
                }
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contrasena, salt);

        const [userRes] = await connection.query(
            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
            [correo_electronico, hash, telefono]
        );

        const [tutorRes] = await connection.query(
            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [userRes.insertId, nombres, apellido_paterno, apellido_materno, notificaciones || 'correo', imageUrl]
        );

        if (alumnos) {
            const alumnosIds = Array.isArray(alumnos) ? alumnos : [alumnos];
            for (const alumnoId of alumnosIds) {
                if(alumnoId) {
                    await connection.query(
                        'INSERT INTO alumnos_tutores (id_perfil_alumno_fk, id_perfil_tutor_fk, parentesco) VALUES (?, ?, ?)',
                        [alumnoId, tutorRes.insertId, 'Tutor']
                    );
                }
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Tutor registrado.' });

    } catch (error) {
        if (connection) await connection.rollback();
        if (imageUrl) await deleteImage(imageUrl);
        
        let msg = 'Error interno.';
        if (error.code === 'ER_DUP_ENTRY') msg = 'Correo o teléfono ya registrados.';
        if (error.message.includes('máximo de 2 tutores')) msg = error.message;

        res.status(400).json({ success: false, message: msg });
    } finally {
        if (connection) connection.release();
    }
};

const updateTutor = async (req, res) => {
    const { id } = req.params;
    const { 
        nombres, apellido_paterno, apellido_materno, 
        correo_electronico, telefono, contrasena, notificaciones, esta_activo, 
        imagen_url_actual,
        alumnos 
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

        await connection.query('DELETE FROM alumnos_tutores WHERE id_perfil_tutor_fk = ?', [id]);

        if (alumnos) {
            const alumnosIds = Array.isArray(alumnos) ? alumnos : [alumnos];
            for (const alumnoId of alumnosIds) {
                if(alumnoId) {
                    const [count] = await connection.query(
                        'SELECT COUNT(*) as total FROM alumnos_tutores WHERE id_perfil_alumno_fk = ?',
                        [alumnoId]
                    );
                    if (count[0].total >= 2) {
                        throw new Error(`El alumno ID ${alumnoId} ya tiene 2 tutores.`);
                    }
                }
            }
        }

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

        if (alumnos) {
            const alumnosIds = Array.isArray(alumnos) ? alumnos : [alumnos];
            for (const alumnoId of alumnosIds) {
                if(alumnoId) {
                    await connection.query(
                        'INSERT INTO alumnos_tutores (id_perfil_alumno_fk, id_perfil_tutor_fk, parentesco) VALUES (?, ?, ?)',
                        [alumnoId, id, 'Tutor']
                    );
                }
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Actualizado.' });
    } catch (error) {
        if (connection) await connection.rollback();
        let msg = 'Error al actualizar.';
        if (error.message.includes('tiene 2 tutores')) msg = error.message;
        res.status(400).json({ success: false, message: msg });
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
    if (!req.file) return res.status(400).json({ success: false, message: 'Falta archivo.' });

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
                    const { 
                        correo_electronico, telefono, contrasena, 
                        nombres, apellido_paterno, apellido_materno, 
                        boleta_alumno 
                    } = tutor;

                    if (!correo_electronico || !contrasena || !nombres || !apellido_paterno) {
                        processingErrors.push({ fila: index + 2, error: 'Datos obligatorios faltantes.' });
                        continue;
                    }

                    try {
                        await connection.beginTransaction();

                        let idAlumno = null;
                        if (boleta_alumno) {
                            const [alumnos] = await connection.query('SELECT id_perfil_alumno FROM perfil_alumno WHERE boleta = ?', [boleta_alumno]);
                            if (alumnos.length > 0) {
                                idAlumno = alumnos[0].id_perfil_alumno;
                                const [count] = await connection.query(
                                    'SELECT COUNT(*) as total FROM alumnos_tutores WHERE id_perfil_alumno_fk = ?',
                                    [idAlumno]
                                );
                                if (count[0].total >= 2) {
                                    throw new Error(`El alumno con boleta ${boleta_alumno} ya tiene 2 tutores.`);
                                }
                            }
                        }

                        const hash = await bcrypt.hash(contrasena, 10);
                        const [userRes] = await connection.query(
                            'INSERT INTO usuarios (correo_electronico, contrasena_hash, telefono, rol) VALUES (?, ?, ?, "tutor")',
                            [correo_electronico, hash, telefono]
                        );

                        const [tutorRes] = await connection.query(
                            'INSERT INTO perfil_tutor (id_usuario_fk, nombres, apellido_paterno, apellido_materno, notificaciones) VALUES (?, ?, ?, ?, "correo")',
                            [userRes.insertId, nombres, apellido_paterno, apellido_materno]
                        );

                        if (idAlumno) {
                            await connection.query(
                                'INSERT INTO alumnos_tutores (id_perfil_alumno_fk, id_perfil_tutor_fk, parentesco) VALUES (?, ?, ?)',
                                [idAlumno, tutorRes.insertId, 'Tutor']
                            );
                        }

                        await connection.commit();
                        count++;
                    } catch (error) {
                        await connection.rollback();
                        let msg = 'Error BD';
                        if (error.code === 'ER_DUP_ENTRY') msg = 'Correo/Teléfono duplicado';
                        if (error.message && error.message.includes('ya tiene 2 tutores')) msg = error.message;
                        processingErrors.push({ fila: index + 2, error: msg });
                    }
                }

                res.status(201).json({
                    success: true,
                    message: `Procesado. Registrados: ${count}. Errores: ${processingErrors.length}.`,
                    errores: processingErrors
                });

            } catch (error) {
                res.status(500).json({ success: false, message: 'Error masivo.' });
            } finally {
                if (connection) connection.release();
            }
        });
};

const loginTutorApp = async (req, res) => {
    const { correo, password } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT u.id_usuario, u.contrasena_hash, u.esta_activo, t.id_perfil_tutor, t.nombres 
             FROM usuarios u 
             JOIN perfil_tutor t ON u.id_usuario = t.id_usuario_fk 
             WHERE u.correo_electronico = ? AND u.rol = 'tutor'`,
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const user = rows[0];

        if (user.esta_activo !== 1) {
            return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
        }

        const validPass = await bcrypt.compare(password, user.contrasena_hash);
        if (!validPass) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        req.session.user = {
            id_usuario: user.id_usuario,
            rol: 'tutor',
            id_perfil_tutor: user.id_perfil_tutor,
            nombre: user.nombres
        };

        res.status(200).json({ success: true, message: 'Login correcto' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};



const getTutorAppAlumnos = async (req, res) => {
    if (!req.session.user || !req.session.user.id_perfil_tutor) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    const tutorId = req.session.user.id_perfil_tutor;
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `
            SELECT 
                a.id_perfil_alumno, 
                a.nombres, 
                a.apellido_paterno, 
                a.apellido_materno, 
                a.imagen_url as foto_url,  
                a.boleta, 
                a.grupo, 
                a.grado,
                g.hora_entrada as horario_entrada,
                g.hora_salida as horario_salida,
                (SELECT fecha_hora_entrada FROM asistencia ast WHERE ast.id_perfil_alumno_fk = a.id_perfil_alumno ORDER BY ast.fecha_hora_entrada DESC LIMIT 1) as ultima_entrada,
                (SELECT fecha_hora_salida FROM asistencia ast WHERE ast.id_perfil_alumno_fk = a.id_perfil_alumno ORDER BY ast.fecha_hora_entrada DESC LIMIT 1) as ultima_salida,
                (SELECT estatus FROM asistencia ast WHERE ast.id_perfil_alumno_fk = a.id_perfil_alumno ORDER BY ast.fecha_hora_entrada DESC LIMIT 1) as ultimo_estatus
            FROM perfil_alumno a 
            JOIN alumnos_tutores at ON a.id_perfil_alumno = at.id_perfil_alumno_fk 
            LEFT JOIN grupos_disponibles g ON a.grado = g.grado AND a.grupo = g.grupo
            WHERE at.id_perfil_tutor_fk = ?
        `;
        const [rows] = await connection.query(query, [tutorId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

const logoutTutor = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: 'Logout exitoso' });
    });
};
const getTutorAppAlumnoDetalle = async (req, res) => {
    if (!req.session.user || !req.session.user.id_perfil_tutor) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    const tutorId = req.session.user.id_perfil_tutor;
    const alumnoId = req.params.id;

    let connection;
    try {
        connection = await pool.getConnection();

        const queryInfo = `
            SELECT a.*, g.hora_entrada, g.hora_salida 
            FROM perfil_alumno a
            JOIN alumnos_tutores at ON a.id_perfil_alumno = at.id_perfil_alumno_fk
            LEFT JOIN grupos_disponibles g ON a.grado = g.grado AND a.grupo = g.grupo
            WHERE at.id_perfil_tutor_fk = ? AND a.id_perfil_alumno = ?
        `;
        
        const [alumno] = await connection.query(queryInfo, [tutorId, alumnoId]);

        if (alumno.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado o no autorizado' });
        }

        const queryHistorial = `
            SELECT * FROM asistencia 
            WHERE id_perfil_alumno_fk = ? 
            ORDER BY fecha_hora_entrada DESC 
            LIMIT 50
        `;
        const [historial] = await connection.query(queryHistorial, [alumnoId]);

        res.status(200).json({ 
            success: true, 
            data: {
                info: alumno[0],
                historial: historial
            } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener historial' });
    } finally {
        if (connection) connection.release();
    }
};
const getTutorAppProfile = async (req, res) => {
    if (!req.session.user || !req.session.user.id_perfil_tutor) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    const tutorId = req.session.user.id_perfil_tutor;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                t.nombres, t.apellido_paterno, t.apellido_materno, t.imagen_url,
                t.notify_entrada, t.notify_salida, t.notify_retardo, t.notify_falta,
                u.correo_electronico, u.telefono 
             FROM perfil_tutor t 
             JOIN usuarios u ON t.id_usuario_fk = u.id_usuario 
             WHERE t.id_perfil_tutor = ?`,
            [tutorId]
        );
        if (rows.length > 0) {
            res.status(200).json({ success: true, data: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Perfil no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

const updateTutorAppProfile = async (req, res) => {
    if (!req.session.user || !req.session.user.id_perfil_tutor) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    const tutorId = req.session.user.id_perfil_tutor;
    const userId = req.session.user.id_usuario;
    
    const { 
        telefono, 
        password, 
        notify_entrada, notify_salida, notify_retardo, notify_falta,
        imagen_url_actual 
    } = req.body;

    let connection;
    let newImageUrl = imagen_url_actual;

    try {
        if (req.file) {
            const nombreArchivo = `${req.session.user.nombre || 'tutor'}_${Date.now()}`;
            newImageUrl = await saveImage(req.file, 'tutores', nombreArchivo);
            if (imagen_url_actual && imagen_url_actual !== '/assets/img/default-avatar.png') {
                await deleteImage(imagen_url_actual);
            }
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        let userQuery = 'UPDATE usuarios SET telefono = ?';
        let userParams = [telefono];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            userQuery += ', contrasena_hash = ?';
            userParams.push(hash);
        }
        
        userQuery += ' WHERE id_usuario = ?';
        userParams.push(userId);
        
        await connection.query(userQuery, userParams);

        const nEntrada = (notify_entrada === 'true' || notify_entrada === 'on') ? 1 : 0;
        const nSalida = (notify_salida === 'true' || notify_salida === 'on') ? 1 : 0;
        const nRetardo = (notify_retardo === 'true' || notify_retardo === 'on') ? 1 : 0;
        const nFalta = (notify_falta === 'true' || notify_falta === 'on') ? 1 : 0;

        await connection.query(
            `UPDATE perfil_tutor 
             SET imagen_url = ?, 
                 notify_entrada = ?, notify_salida = ?, notify_retardo = ?, notify_falta = ?
             WHERE id_perfil_tutor = ?`,
            [newImageUrl, nEntrada, nSalida, nRetardo, nFalta, tutorId]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: 'Perfil actualizado correctamente' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    } finally {
        if (connection) connection.release();
    }
};
module.exports = {
    getAllTutores,
    getTutorById,
    registerTutor,
    updateTutor,
    deleteTutor,
    registerTutoresMasivo,
    loginTutorApp,
    getTutorAppProfile,
    getTutorAppAlumnos,
    logoutTutor,
    getTutorAppAlumnoDetalle,
    updateTutorAppProfile,
    getTutorAppProfile

};