const pool = require('../services/db.service');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const generarReporteAsistencia = async (req, res) => {
    const { formato, fechaInicio, fechaFin, grupo, boleta } = req.query;

    let connection;
    try {
        connection = await pool.getConnection();
        
        let query = `
            SELECT 
                a.fecha_hora_entrada, 
                a.fecha_hora_salida, 
                a.estatus,
                p.nombres, p.apellido_paterno, p.apellido_materno, p.boleta, p.grupo
            FROM asistencia a
            JOIN perfil_alumno p ON a.id_perfil_alumno_fk = p.id_perfil_alumno
            WHERE DATE(a.fecha_hora_entrada) >= ? AND DATE(a.fecha_hora_entrada) <= ?
        `;
        
        const params = [fechaInicio, fechaFin];

        if (grupo) {
            query += ' AND p.grupo = ?';
            params.push(grupo);
        }
        if (boleta) {
            query += ' AND p.boleta = ?';
            params.push(boleta);
        }
        
        query += ' ORDER BY a.fecha_hora_entrada ASC';

        const [rows] = await connection.query(query, params);

        if (formato === 'pdf') {
            const doc = new PDFDocument({ margin: 40 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=asistencia_${fechaInicio}_${fechaFin}.pdf`);
            
            doc.pipe(res);

            doc.fontSize(16).text('Reporte de Asistencia Detallado', { align: 'center' });
            doc.fontSize(10).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown();
            
            let filtrosTexto = `Periodo: ${fechaInicio} al ${fechaFin}`;
            if(grupo) filtrosTexto += ` | Grupo: ${grupo}`;
            if(boleta) filtrosTexto += ` | Boleta: ${boleta}`;
            
            doc.fontSize(12).text(filtrosTexto, { align: 'center' });
            doc.moveDown();

            const startDate = new Date(fechaInicio);
            const endDate = new Date(fechaFin);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0]; 
                const registrosDia = rows.filter(r => new Date(r.fecha_hora_entrada).toISOString().split('T')[0] === dateStr);

                doc.fontSize(12).fillColor('#000').text(`Fecha: ${dateStr}`, { underline: true });
                doc.moveDown(0.5);

                if (registrosDia.length === 0) {
                    doc.fontSize(10).fillColor('#777').text('   Sin registros de actividad.', { indent: 20 });
                } else {
                    registrosDia.forEach((row, i) => {
                        const entrada = new Date(row.fecha_hora_entrada).toLocaleTimeString();
                        const salida = row.fecha_hora_salida ? new Date(row.fecha_hora_salida).toLocaleTimeString() : '---';
                        const nombreComp = `${row.nombres} ${row.apellido_paterno} ${row.apellido_materno || ''}`;
                        
                        doc.fontSize(10).fillColor('#000').text(
                            `   ${entrada} - ${salida} | ${row.estatus.toUpperCase()} | ${nombreComp} (${row.boleta})`, 
                            { indent: 20 }
                        );
                    });
                }
                doc.moveDown(1);
            }

            doc.end();

        } else if (formato === 'csv') {
            const fields = ['Fecha', 'Entrada', 'Salida', 'Estatus', 'Alumno', 'Boleta', 'Grupo'];
            const data = rows.map(r => ({
                Fecha: new Date(r.fecha_hora_entrada).toISOString().split('T')[0],
                Entrada: new Date(r.fecha_hora_entrada).toLocaleTimeString(),
                Salida: r.fecha_hora_salida ? new Date(r.fecha_hora_salida).toLocaleTimeString() : '---',
                Estatus: r.estatus,
                Alumno: `${r.nombres} ${r.apellido_paterno}`,
                Boleta: r.boleta,
                Grupo: r.grupo
            }));

            const json2csvParser = new Parser({ fields, withBOM: true });
            const csv = json2csvParser.parse(data);

            res.header('Content-Type', 'text/csv');
            res.attachment(`asistencia_${Date.now()}.csv`);
            return res.send(csv);
        } else {
            res.status(400).json({ success: false, message: 'Formato no soportado' });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generando reporte' });
    } finally {
        if (connection) connection.release();
    }
};

const generarReporteAlumnos = async (req, res) => {
    const { formato, grado } = req.query;

    let connection;
    try {
        connection = await pool.getConnection();
        
        let query = `
            SELECT p.nombres, p.apellido_paterno, p.apellido_materno, p.boleta, p.curp, p.grado, p.grupo, u.correo_electronico 
            FROM perfil_alumno p
            JOIN usuarios u ON p.id_usuario_fk = u.id_usuario
            WHERE u.esta_activo = 1
        `;
        
        if (grado) query += ' AND p.grado = ?';
        query += ' ORDER BY p.grado, p.grupo, p.apellido_paterno';

        const params = grado ? [grado] : [];
        const [rows] = await connection.query(query, params);

        if (formato === 'pdf') {
            const doc = new PDFDocument({ margin: 40 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=alumnos_${Date.now()}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).text('Directorio de Alumnos', { align: 'center' });
            if(grado) doc.fontSize(12).text(`Filtrado por: ${grado}° Semestre`, { align: 'center' });
            doc.moveDown();

            rows.forEach((row, i) => {
                doc.fontSize(11).text(`${i + 1}. ${row.apellido_paterno} ${row.apellido_materno || ''} ${row.nombres}`);
                doc.fontSize(9).fillColor('#555').text(`   Boleta: ${row.boleta} | Grupo: ${row.grupo} | Email: ${row.correo_electronico}`);
                doc.moveDown(0.5);
                doc.fillColor('#000');
            });
            doc.end();

        } else if (formato === 'csv') {
            const fields = ['nombres', 'apellido_paterno', 'apellido_materno', 'boleta', 'curp', 'grado', 'grupo', 'correo_electronico'];
            const json2csvParser = new Parser({ fields, withBOM: true }); 
            const csv = json2csvParser.parse(rows);

            res.header('Content-Type', 'text/csv');
            res.attachment(`alumnos_${Date.now()}.csv`);
            return res.send(csv);
        }

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    generarReporteAsistencia,
    generarReporteAlumnos
};