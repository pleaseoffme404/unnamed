const cron = require('node-cron');
const pool = require('./db.service');
const { enviarCorreo, templates } = require('./email.service');

const ejecutarBarridoFaltas = async (turno) => {
    console.log(`[CRON] Iniciando barrido para turno: ${turno}`);
    
    let filtroGrupo = '';
    if (turno === 'matutino') {
        filtroGrupo = "AND pa.grupo LIKE '%IM%'";
    } else if (turno === 'vespertino') {
        filtroGrupo = "AND pa.grupo LIKE '%IV%'";
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const query = `
            SELECT 
                pa.nombres, 
                pa.apellido_paterno, 
                u_tutor.correo_electronico
            FROM perfil_alumno pa
            LEFT JOIN asistencia a 
                ON pa.id_perfil_alumno = a.id_perfil_alumno_fk 
                AND DATE(a.fecha_hora_entrada) = CURDATE()
            JOIN alumnos_tutores rel ON pa.id_perfil_alumno = rel.id_perfil_alumno_fk
            JOIN perfil_tutor pt ON rel.id_perfil_tutor_fk = pt.id_perfil_tutor
            JOIN usuarios u_tutor ON pt.id_usuario_fk = u_tutor.id_usuario
            WHERE a.id_asistencia IS NULL 
            AND pt.notify_falta = 1
            ${filtroGrupo}
        `;

        const [faltantes] = await connection.query(query);

        if (faltantes.length === 0) {
            console.log(`[CRON] No se detectaron faltas para el turno ${turno}.`);
            return;
        }

        console.log(`[CRON] Detectados ${faltantes.length} alumnos ausentes en turno ${turno}. Enviando correos...`);
        
        const fechaHoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const promesasEmail = faltantes.map(alumno => {
            const nombreCompleto = `${alumno.nombres} ${alumno.apellido_paterno}`;
            const html = templates.falta(nombreCompleto, fechaHoy);
            return enviarCorreo(alumno.correo_electronico, 'Aviso de Inasistencia', html);
        });

        await Promise.all(promesasEmail);
        console.log('[CRON] Notificaciones enviadas exitosamente.');

    } catch (error) {
        console.error('[CRON] Error en barrido de faltas:', error);
    } finally {
        if (connection) connection.release();
    }
};

/*cron.schedule('* * * * *', () => {
    ejecutarBarridoFaltas('test');
});
*/
cron.schedule('0 7 * * 1-5', () => {
    ejecutarBarridoFaltas('matutino');
});

cron.schedule('0 14 * * 1-5', () => {
    ejecutarBarridoFaltas('vespertino');
});

console.log('[CRON] Servicios programados iniciados.');

module.exports = { ejecutarBarridoFaltas };