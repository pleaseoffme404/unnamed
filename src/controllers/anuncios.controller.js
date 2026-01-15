const pool = require('../services/db.service');

const getAllAnuncios = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                a.id_anuncio, a.titulo, a.contenido, a.destinatarios, a.fecha_publicacion, a.prioridad,
                p.nombre_completo as autor
            FROM anuncios a
            LEFT JOIN perfil_admin p ON a.id_admin_fk = p.id_perfil_admin
            ORDER BY a.prioridad DESC, a.fecha_publicacion DESC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    } finally {
        if (connection) connection.release();
    }
};

const getAnuncioById = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM anuncios WHERE id_anuncio = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const createAnuncio = async (req, res) => {
    const { titulo, contenido, destinatarios, prioridad } = req.body; 

    
    let userId = 1; 
    if (req.session && req.session.user) {
        userId = req.session.user.id_usuario || req.session.user.id || 1;
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        let adminId = 1;
        
        try {
            const [admins] = await connection.query('SELECT id_perfil_admin FROM perfil_admin WHERE id_usuario_fk = ?', [userId]);
            if (admins.length > 0) {
                adminId = admins[0].id_perfil_admin;
            }
        } catch (ignored) {
            console.log("No se pudo verificar perfil, usando ID 1 por defecto");
        }
        
        const priorityValue = prioridad === 'urgente' ? 'urgente' : 'normal';

        await connection.query(
            'INSERT INTO anuncios (id_admin_fk, titulo, contenido, destinatarios, prioridad) VALUES (?, ?, ?, ?, ?)',
            [adminId, titulo, contenido, destinatarios, priorityValue]
        );

        res.status(201).json({ success: true, message: 'Anuncio publicado.' });
    } catch (error) {
        console.error("Error al crear anuncio:", error);
        res.status(500).json({ success: false, message: 'Error en base de datos: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
};

const updateAnuncio = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, destinatarios, prioridad } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        const priorityValue = prioridad === 'urgente' ? 'urgente' : 'normal';

        await connection.query(
            'UPDATE anuncios SET titulo=?, contenido=?, destinatarios=?, prioridad=? WHERE id_anuncio=?',
            [titulo, contenido, destinatarios, priorityValue, id]
        );
        res.status(200).json({ success: true, message: 'Actualizado.' });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

const deleteAnuncio = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query('DELETE FROM anuncios WHERE id_anuncio = ?', [id]);
        res.status(200).json({ success: true, message: 'Eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};


const getAnunciosPortal = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT id_anuncio, titulo, contenido, fecha_publicacion, prioridad 
             FROM anuncios 
             ORDER BY prioridad DESC, fecha_publicacion DESC LIMIT 20`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error obteniendo anuncios' });
    } finally {
        if (connection) connection.release();
    }
};

const getAnunciosUrgentes = async (req, res) => {
    return getAnunciosPortal(req, res);
};

module.exports = {
    getAllAnuncios,
    getAnuncioById,
    createAnuncio,
    updateAnuncio,
    deleteAnuncio,
    getAnunciosPortal,
    getAnunciosUrgentes
};