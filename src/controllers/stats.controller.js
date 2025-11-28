const pool = require('../services/db.service');

const getCounts = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [alumnosData] = await connection.query('SELECT COUNT(*) as count FROM perfil_alumno p JOIN usuarios u ON p.id_usuario_fk = u.id_usuario WHERE u.esta_activo = 1');
        const totalAlumnos = alumnosData[0].count;

        const [tutoresData] = await connection.query('SELECT COUNT(*) as count FROM perfil_tutor');
        
        const [anunciosData] = await connection.query('SELECT COUNT(*) as count FROM anuncios');
        
        const [entradasHoy] = await connection.query(
            'SELECT COUNT(*) as count FROM asistencia WHERE DATE(fecha_hora_entrada) = CURDATE()'
        );
        
        const [enPlantel] = await connection.query(
            'SELECT COUNT(*) as count FROM asistencia WHERE DATE(fecha_hora_entrada) = CURDATE() AND fecha_hora_salida IS NULL'
        );

        res.status(200).json({
            success: true,
            data: {
                alumnos: totalAlumnos,
                tutores: tutoresData[0].count,
                anuncios: anunciosData[0].count,
                asistencias_hoy: entradasHoy[0].count,
                en_plantel: enPlantel[0].count,
                ya_salieron: entradasHoy[0].count - enPlantel[0].count
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getCounts
};