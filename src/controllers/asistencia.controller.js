const pool = require('./../services/db.service');
const { DateTime } = require('luxon');

const registrarEntrada = async (req, res) => {
    const { qr_token } = req.body;

    if (!qr_token) {
        return res.status(400).json({ success: false, message: 'Token QR es requerido.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [alumnos] = await connection.query(
            'SELECT id_perfil_alumno FROM perfil_alumno WHERE qr_token = ?',
            [qr_token]
        );

        if (alumnos.length === 0) {
            return res.status(404).json({ success: false, message: 'QR no válido o no asignado.' });
        }

        const id_perfil_alumno_fk = alumnos[0].id_perfil_alumno;
        const fecha_hora_entrada = DateTime.now().setZone('America/Mexico_City').toSQL({ includeOffset: false });

        const [result] = await connection.query(
            'INSERT INTO asistencia (id_perfil_alumno_fk, fecha_hora_entrada, metodo_entrada) VALUES (?, ?, ?)',
            [id_perfil_alumno_fk, fecha_hora_entrada, 'qr']
        );

        res.status(201).json({ success: true, message: 'Asistencia registrada.', id: result.insertId });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const getHistorial = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                a.id_asistencia, a.fecha_hora_entrada, a.fecha_hora_salida, a.metodo_entrada,
                p.nombres, p.apellido_paterno, p.apellido_materno
            FROM asistencia a
            JOIN perfil_alumno p ON a.id_perfil_alumno_fk = p.id_perfil_alumno
            ORDER BY a.fecha_hora_entrada DESC
            LIMIT 100`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const getHistorialByAlumno = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                a.id_asistencia, a.fecha_hora_entrada, a.fecha_hora_salida, a.metodo_entrada
            FROM asistencia a
            WHERE a.id_perfil_alumno_fk = ?
            ORDER BY a.fecha_hora_entrada DESC`,
            [id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    registrarEntrada,
    getHistorial,
    getHistorialByAlumno
};