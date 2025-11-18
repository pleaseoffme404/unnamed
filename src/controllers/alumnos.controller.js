const pool = require('../services/db.service');

exports.getAllAlumnos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT boleta, nombre_completo, grupo_id FROM Alumnos');
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener alumnos.' });
    }
};

exports.createAlumno = async (req, res) => {
    const { boleta, nombre_completo, fecha_nacimiento, genero, foto_url, grupo_id } = req.body;

    if (!boleta || !nombre_completo || !grupo_id) {
         return res.status(400).json({ message: 'Boleta, nombre y grupo son requeridos.' });
    }

    try {
        await pool.query(
            'INSERT INTO Alumnos (boleta, nombre_completo, fecha_nacimiento, genero, foto_url, grupo_id) VALUES (?, ?, ?, ?, ?, ?)',
            [boleta, nombre_completo, fecha_nacimiento, genero, foto_url, grupo_id]
        );
        res.status(201).json({ message: 'Alumno creado exitosamente.' });
    } catch (error) {
        console.error(error);
         if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La boleta ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el alumno.' });
    }
};