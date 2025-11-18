const pool = require('./../services/db.service');

const createAnuncio = async (req, res) => {
    const { titulo, contenido, destinatarios } = req.body;
    const id_usuario_admin = req.session.user.id;

    if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: 'Título y contenido son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [adminProfile] = await connection.query('SELECT id_perfil_admin FROM perfil_admin WHERE id_usuario_fk = ?', [id_usuario_admin]);
        
        if(adminProfile.length === 0) {
            return res.status(403).json({ success: false, message: 'Perfil de administrador no encontrado.' });
        }
        
        const id_admin_fk = adminProfile[0].id_perfil_admin;
        
        const [result] = await connection.query(
            'INSERT INTO anuncios (id_admin_fk, titulo, contenido, destinatarios) VALUES (?, ?, ?, ?)',
            [id_admin_fk, titulo, contenido, destinatarios || 'todos']
        );
        res.status(201).json({ success: true, message: 'Anuncio creado.', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const getAllAnuncios = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT a.*, p.nombre_completo as autor 
            FROM anuncios a
            JOIN perfil_admin p ON a.id_admin_fk = p.id_perfil_admin
            ORDER BY a.fecha_publicacion DESC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateAnuncio = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, destinatarios } = req.body;

    if (!titulo || !contenido) {
        return res.status(400).json({ success: false, message: 'Título y contenido son requeridos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query(
            'UPDATE anuncios SET titulo = ?, contenido = ?, destinatarios = ? WHERE id_anuncio = ?',
            [titulo, contenido, destinatarios, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Anuncio actualizado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const deleteAnuncio = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query(
            'DELETE FROM anuncios WHERE id_anuncio = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Anuncio eliminado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createAnuncio,
    getAllAnuncios,
    updateAnuncio,
    deleteAnuncio
};