const pool = require('../services/db.service');

const getHistorial = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [rows] = await connection.query(
            `SELECT 
                a.id_asistencia, 
                a.fecha_hora_entrada, 
                a.fecha_hora_salida, 
                a.metodo_entrada,
                p.nombres, p.apellido_paterno, p.apellido_materno, p.boleta, p.grupo, p.imagen_url
            FROM asistencia a
            JOIN perfil_alumno p ON a.id_perfil_alumno_fk = p.id_perfil_alumno
            ORDER BY a.fecha_hora_entrada DESC
            LIMIT 100`
        );
        
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener historial.' });
    } finally {
        if (connection) connection.release();
    }
};

const simularMovimiento = async (req, res) => {
    const { id_alumno, tipo_movimiento } = req.body; 

    if (!id_alumno) {
        return res.status(400).json({ success: false, message: 'Alumno requerido.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [alumno] = await connection.query('SELECT id_perfil_alumno FROM perfil_alumno WHERE id_perfil_alumno = ?', [id_alumno]);
        if (alumno.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
        }

        const [ultimoRegistro] = await connection.query(
            `SELECT id_asistencia, fecha_hora_entrada, fecha_hora_salida 
             FROM asistencia 
             WHERE id_perfil_alumno_fk = ? 
             ORDER BY fecha_hora_entrada DESC LIMIT 1`,
            [id_alumno]
        );

        let mensaje = '';
        let accion = '';

        if (tipo_movimiento === 'salida') {
            if (ultimoRegistro.length > 0 && ultimoRegistro[0].fecha_hora_salida === null) {
                await connection.query(
                    'UPDATE asistencia SET fecha_hora_salida = NOW() WHERE id_asistencia = ?',
                    [ultimoRegistro[0].id_asistencia]
                );
                mensaje = 'Salida registrada correctamente.';
                accion = 'salida';
            } else {
                return res.status(400).json({ success: false, message: 'El alumno no tiene una entrada activa.' });
            }
        } else {
            if (ultimoRegistro.length > 0 && ultimoRegistro[0].fecha_hora_salida === null) {
                return res.status(400).json({ success: false, message: 'El alumno ya está dentro (falta registrar salida).' });
            }
            
            await connection.query(
                'INSERT INTO asistencia (id_perfil_alumno_fk, fecha_hora_entrada, metodo_entrada) VALUES (?, NOW(), "manual")',
                [id_alumno]
            );
            mensaje = 'Entrada registrada correctamente.';
            accion = 'entrada';
        }

        res.status(200).json({ success: true, message: mensaje, accion: accion });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en simulación.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getHistorial,
    simularMovimiento
};