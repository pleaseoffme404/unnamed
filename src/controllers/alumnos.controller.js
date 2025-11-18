const pool = require('../services/db.service');
const fs = require('fs');
const csv = require('csv-parser');

const createAlumno = async (req, res) => {
    const { boleta, nombre_completo, fecha_nacimiento, genero, grupo_id } = req.body;

    if (!boleta || !nombre_completo || !genero || !grupo_id) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    let fotoUrl = null;
    if (req.file) {
        fotoUrl = '/assets/uploads/img/alumnos/' + req.file.filename;
    }

    try {
        await pool.query(
            'INSERT INTO Alumnos (boleta, nombre_completo, fecha_nacimiento, genero, foto_url, grupo_id) VALUES (?, ?, ?, ?, ?, ?)',
            [boleta, nombre_completo, fecha_nacimiento || null, genero, fotoUrl, grupo_id]
        );
        res.status(201).json({ success: true, message: 'Alumno creado exitosamente.' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'La boleta ya está registrada.' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ success: false, message: 'El grupo especificado no existe.' });
        }
        res.status(500).json({ success: false, message: 'Error al crear el alumno.' });
    }
};

const uploadAlumnosCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
    }

    const filePath = req.file.path;
    const alumnos = [];
    const errores = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            alumnos.push(row);
        })
        .on('end', async () => {
            fs.unlinkSync(filePath); 

            if (alumnos.length === 0) {
                return res.status(400).json({ success: false, message: 'El archivo CSV está vacío o en un formato incorrecto.' });
            }

            const connection = await pool.getConnection();
            let exitosos = 0;
            let fallidos = 0;

            try {
                await connection.beginTransaction();

                for (const [index, alumno] of alumnos.entries()) {
                    if (!alumno.boleta || !alumno.nombre_completo || !alumno.genero || !alumno.grupo_id) {
                        errores.push(`Fila ${index + 2}: Faltan datos obligatorios.`);
                        fallidos++;
                        continue;
                    }
                    
                    try {
                        await connection.query(
                            'INSERT INTO Alumnos (boleta, nombre_completo, fecha_nacimiento, genero, grupo_id) VALUES (?, ?, ?, ?, ?)',
                            [
                                alumno.boleta, 
                                alumno.nombre_completo, 
                                alumno.fecha_nacimiento || null, 
                                alumno.genero, 
                                alumno.grupo_id
                            ]
                        );
                        exitosos++;
                    } catch (error) {
                        fallidos++;
                        if (error.code === 'ER_DUP_ENTRY') {
                            errores.push(`Fila ${index + 2} (Boleta ${alumno.boleta}): Ya existe.`);
                        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                            errores.push(`Fila ${index + 2} (Grupo ${alumno.grupo_id}): El grupo no existe.`);
                        } else {
                            errores.push(`Fila ${index + 2}: Error DB ${error.code}`);
                        }
                    }
                }

                if (fallidos > 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Se canceló la operación. Se encontraron ${fallidos} errores.`,
                        errores: errores
                    });
                } else {
                    await connection.commit();
                    res.status(200).json({ 
                        success: true, 
                        message: `Se importaron ${exitosos} alumnos exitosamente.` 
                    });
                }

            } catch (error) {
                await connection.rollback();
                console.error(error);
                res.status(500).json({ success: false, message: 'Error de transacción en la base de datos.' });
            } finally {
                connection.release();
            }
        })
        .on('error', (error) => {
            fs.unlinkSync(filePath);
            res.status(500).json({ success: false, message: 'Error al procesar el archivo CSV.' });
        });
};

module.exports = {
    createAlumno,
    uploadAlumnosCSV
};