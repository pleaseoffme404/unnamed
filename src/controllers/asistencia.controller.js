const pool = require('../services/db.service');
const { validateAndBurnToken } = require('./qr.controller');

const getHistorial = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                a.id_asistencia, a.fecha_hora_entrada, a.fecha_hora_salida, a.metodo_entrada, a.estatus,
                p.nombres, p.apellido_paterno, p.apellido_materno, p.boleta, p.grupo, p.imagen_url
            FROM asistencia a
            JOIN perfil_alumno p ON a.id_perfil_alumno_fk = p.id_perfil_alumno
            ORDER BY a.fecha_hora_entrada DESC
            LIMIT 100`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno.' });
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
            `SELECT * FROM asistencia WHERE id_perfil_alumno_fk = ? ORDER BY fecha_hora_entrada DESC`,
            [id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const registrarAsistenciaQR = async (req, res) => {
    const { qr_token, id_alumno } = req.body;

    if (!qr_token || !id_alumno) {
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    const check = await validateAndBurnToken(qr_token, id_alumno); 
    if (!check.valid) return res.status(401).json({ success: false, message: check.message });

    procesarMovimiento(id_alumno, 'qr', res);
};

const simularMovimiento = async (req, res) => {
    const { id_alumno, tipo } = req.body;
    if (!id_alumno || !tipo) return res.status(400).json({ success: false });
    
    procesarMovimiento(id_alumno, 'manual', res, tipo);
};

const procesarMovimiento = async (idAlumno, metodo, res, tipoForzado = null) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [entradaAbierta] = await connection.query(
            `SELECT id_asistencia FROM asistencia 
             WHERE id_perfil_alumno_fk = ? AND fecha_hora_salida IS NULL AND DATE(fecha_hora_entrada) = CURDATE()`,
            [idAlumno]
        );

        let esSalida = false;
        
        if (tipoForzado) {
            esSalida = (tipoForzado === 'salida');
        } else {
            esSalida = (entradaAbierta.length > 0);
        }

        const [infoAlumno] = await connection.query(
            `SELECT 
                p.nombres, p.apellido_paterno, p.apellido_materno, p.grupo, p.imagen_url,
                g.hora_entrada, g.hora_salida,
                v.tipo as v_tipo, v.descripcion as v_desc, v.imagen_url as v_imagen
            FROM perfil_alumno p
            LEFT JOIN grupos_disponibles g ON p.grado = g.grado AND p.grupo = g.grupo
            LEFT JOIN vehiculos v ON p.id_perfil_alumno = v.id_perfil_alumno_fk
            WHERE p.id_perfil_alumno = ?`,
            [idAlumno]
        );

        const alumnoData = infoAlumno[0];

        if (esSalida) {
            if (entradaAbierta.length === 0) {
                return res.status(400).json({ success: false, message: 'No hay entrada activa para salir.' });
            }
            await connection.query(
                'UPDATE asistencia SET fecha_hora_salida = NOW() WHERE id_asistencia = ?',
                [entradaAbierta[0].id_asistencia]
            );
            return res.status(200).json({ 
                success: true, 
                message: 'Salida registrada.', 
                tipo: 'salida',
                alumno: alumnoData
            });
        } else {
            if (entradaAbierta.length > 0) {
                return res.status(400).json({ success: false, message: 'Ya tiene entrada registrada.' });
            }

            const [horario] = await connection.query(
                `SELECT 
                    CASE 
                        WHEN CURTIME() > ADDTIME(g.hora_entrada, '00:10:00') THEN 'retardo' 
                        ELSE 'a_tiempo' 
                    END as estatus_calc
                FROM perfil_alumno p
                JOIN grupos_disponibles g ON p.grado = g.grado AND p.grupo = g.grupo
                WHERE p.id_perfil_alumno = ?`,
                [idAlumno]
            );

            const estatusFinal = (horario.length > 0) ? horario[0].estatus_calc : 'a_tiempo';

            await connection.query(
                'INSERT INTO asistencia (id_perfil_alumno_fk, fecha_hora_entrada, metodo_entrada, estatus) VALUES (?, NOW(), ?, ?)',
                [idAlumno, metodo, estatusFinal]
            );
            
            return res.status(200).json({ 
                success: true, 
                message: `Entrada registrada (${estatusFinal.replace('_', ' ')}).`, 
                tipo: 'entrada',
                estatus_llegada: estatusFinal,
                alumno: alumnoData
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getHistorial,
    getHistorialByAlumno,
    registrarAsistenciaQR,
    simularMovimiento
};