const pool = require('../services/db.service');

const getCounts = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [alumnos] = await connection.query('SELECT COUNT(*) as count FROM perfil_alumno');
        const [tutores] = await connection.query('SELECT COUNT(*) as count FROM perfil_tutor');
        const [admins] = await connection.query('SELECT COUNT(*) as count FROM usuarios WHERE rol = "admin"');
        const [anuncios] = await connection.query('SELECT COUNT(*) as count FROM anuncios');
        
        const [asistenciasHoy] = await connection.query(
            'SELECT COUNT(*) as count FROM asistencia WHERE DATE(fecha_hora_entrada) = CURDATE()'
        );

        res.status(200).json({
            success: true,
            data: {
                alumnos: alumnos[0].count,
                tutores: tutores[0].count,
                admins: admins[0].count,
                anuncios: anuncios[0].count,
                asistencias: asistenciasHoy[0].count
            }
        });

    } catch (error) {
        console.error('Error en stats:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getCounts
};