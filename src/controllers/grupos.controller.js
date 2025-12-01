const pool = require('../services/db.service');

const getAllGrupos = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT g.*, 
            (SELECT COUNT(*) FROM perfil_alumno p WHERE p.grado = g.grado AND p.grupo = g.grupo) as total_alumnos
            FROM grupos_disponibles g 
            ORDER BY g.grado ASC, g.grupo ASC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const getGrupoById = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM grupos_disponibles WHERE id_grupo_disponible = ?', [id]);
        
        if (rows.length === 0) return res.status(404).json({ success: false });
        
        const [alumnos] = await connection.query(
            'SELECT id_perfil_alumno, nombres, apellido_paterno, apellido_materno, boleta, imagen_url FROM perfil_alumno WHERE grado = ? AND grupo = ? ORDER BY apellido_paterno',
            [rows[0].grado, rows[0].grupo]
        );

        const data = rows[0];
        data.lista_alumnos = alumnos;

        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const createGrupo = async (req, res) => {
    const { grado, grupo, hora_entrada, hora_salida } = req.body;

    if (!grado || !grupo || !hora_entrada || !hora_salida) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
    }
    if (grado < 1 || grado > 12) { 
        return res.status(400).json({ success: false, message: 'Semestre invalido.' });
    }
    if (hora_entrada >= hora_salida) {
        return res.status(400).json({ success: false, message: 'Hora de salida debe ser posterior a la entrada.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO grupos_disponibles (grado, grupo, hora_entrada, hora_salida) VALUES (?, ?, ?, ?)',
            [grado, grupo, hora_entrada, hora_salida]
        );
        res.status(201).json({ success: true, message: 'Grupo creado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ya existe un grupo con ese nombre y semestre.' });
        }
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateGrupo = async (req, res) => {
    const { id } = req.params;
    const { hora_entrada, hora_salida } = req.body;

    if (hora_entrada >= hora_salida) {
        return res.status(400).json({ success: false, message: 'Hora de salida debe ser posterior a la entrada.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(
            'UPDATE grupos_disponibles SET hora_entrada=?, hora_salida=? WHERE id_grupo_disponible=?',
            [hora_entrada, hora_salida, id]
        );
        res.status(200).json({ success: true, message: 'Horario actualizado.' });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const deleteGrupo = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        
        const [grupo] = await connection.query('SELECT grado, grupo FROM grupos_disponibles WHERE id_grupo_disponible = ?', [id]);
        if(grupo.length === 0) return res.status(404).json({ success: false, message: 'Grupo no encontrado.' });

        const [alumnos] = await connection.query('SELECT count(*) as c FROM perfil_alumno WHERE grado = ? AND grupo = ?', [grupo[0].grado, grupo[0].grupo]);
        
        if (alumnos[0].c > 0) {
            return res.status(400).json({ success: false, message: 'No se puede eliminar: Hay alumnos inscritos.' });
        }

        await connection.query('DELETE FROM grupos_disponibles WHERE id_grupo_disponible = ?', [id]);
        res.status(200).json({ success: true, message: 'Grupo eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getAllGrupos,
    getGrupoById,
    createGrupo,
    updateGrupo,
    deleteGrupo
};