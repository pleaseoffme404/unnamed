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
    const codigoQR = req.body.qr_code || req.body.qr_token; 
    const idVehiculo = req.body.id_vehiculo || null; 

    if (!codigoQR) {
        return res.status(400).json({ success: false, message: 'Falta el código QR' });
    }

    const idUsuario = req.user.id_usuario;
    let connection;

    try {
        connection = await pool.getConnection();

        const [alumno] = await connection.query('SELECT id_perfil_alumno FROM perfil_alumno WHERE id_usuario_fk = ?', [idUsuario]);
        
        if (alumno.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
        }
        const idAlumno = alumno[0].id_perfil_alumno;

        await connection.query(
            `INSERT INTO asistencia (id_perfil_alumno_fk, fecha_hora_entrada, estatus, metodo_entrada, id_vehiculo_fk) 
             VALUES (?, NOW(), 'a_tiempo', 'qr', ?)`,
            [idAlumno, idVehiculo] 
        );

        res.json({ success: true, message: 'Asistencia registrada correctamente' });

    } catch (error) {
        console.error("Error QR:", error);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

const simularMovimiento = async (req, res) => {
    const { id_alumno, tipo } = req.body;

    if (!id_alumno) {
        return res.status(400).json({ success: false, message: 'Falta el ID del alumno.' });
    }
    
    await procesarMovimiento(id_alumno, 'manual', res, tipo);
};

const procesarMovimiento = async (idAlumno, metodo, res, tipoForzado = null) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [infoAlumno] = await connection.query(
            `SELECT 
                p.nombres, p.apellido_paterno, p.apellido_materno, p.grupo, p.imagen_url,
                g.hora_entrada, g.hora_salida,
                v.tipo as v_tipo, v.descripcion as v_desc, v.imagen_url as v_imagen
            FROM perfil_alumno p
            LEFT JOIN grupos_disponibles g ON p.grado = g.grado AND p.grupo = g.grupo
            LEFT JOIN vehiculos v ON p.id_perfil_alumno = v.id_perfil_alumno_fk
            WHERE p.id_perfil_alumno = ?
            LIMIT 1`, 
            [idAlumno]
        );

        if (infoAlumno.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
        }

        const alumnoData = infoAlumno[0];

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

        if (esSalida) {
            if (entradaAbierta.length === 0) {
                return res.status(400).json({ success: false, message: 'El alumno no tiene entrada registrada hoy.' });
            }

            await connection.query(
                'UPDATE asistencia SET fecha_hora_salida = NOW() WHERE id_asistencia = ?',
                [entradaAbierta[0].id_asistencia]
            );

            return res.status(200).json({ 
                success: true, 
                message: 'Salida registrada correctamente.', 
                tipo: 'salida',
                alumno: alumnoData
            });

        } else {
            if (entradaAbierta.length > 0) {
                return res.status(400).json({ success: false, message: 'El alumno ya está dentro (Entrada duplicada).' });
            }

            const [horario] = await connection.query(
                `SELECT CASE 
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
                `INSERT INTO asistencia (id_perfil_alumno_fk, fecha_hora_entrada, metodo_entrada, estatus, id_vehiculo_fk) 
                 VALUES (?, NOW(), ?, ?, NULL)`,
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
        console.error("Error en simulación:", error);
        res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
    } finally {
        if (connection) connection.release();
    }
};
const obtenerMiHistorial = async (req, res) => {
    const idUsuario = req.user.id_usuario; 

    try {
       
        const query = `
            SELECT 
                DATE_FORMAT(a.fecha_hora_entrada, '%Y-%m-%d %H:%i') as fecha_fmt, 
                a.estatus, 
                a.metodo_entrada
            FROM asistencia a
            JOIN perfil_alumno p ON a.id_perfil_alumno_fk = p.id_perfil_alumno
            WHERE p.id_usuario_fk = ?
            ORDER BY a.fecha_hora_entrada DESC 
            LIMIT 50
        `;

        const [rows] = await pool.query(query, [idUsuario]);

        const historial = rows.map(row => ({
            fecha_hora_entrada: row.fecha_fmt, 
            estatus: row.estatus,        
            metodo_entrada: row.metodo_entrada 
        }));

        res.json({ success: true, data: historial });

    } catch (error) {
        console.error("Error al obtener historial alumno:", error);
        res.status(500).json({ success: false, message: 'Error interno: ' + error.message });
    }
};

module.exports = {
    obtenerMiHistorial,
    getHistorial,
    getHistorialByAlumno,
    registrarAsistenciaQR,
    simularMovimiento
};