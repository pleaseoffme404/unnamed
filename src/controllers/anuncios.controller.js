const pool = require('../services/db.service');

const getAllAnuncios = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                a.id_anuncio, a.titulo, a.contenido, a.destinatarios, a.fecha_publicacion,
                p.nombre_completo as autor
            FROM anuncios a
            JOIN perfil_admin p ON a.id_admin_fk = p.id_perfil_admin
            ORDER BY a.fecha_publicacion DESC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
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
    const { titulo, contenido, destinatarios } = req.body;
    const userId = req.session.user.id;

    if (!titulo || !contenido) return res.status(400).json({ success: false, message: 'Faltan datos.' });

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [admin] = await connection.query('SELECT id_perfil_admin FROM perfil_admin WHERE id_usuario_fk = ?', [userId]);
        if (admin.length === 0) return res.status(403).json({ success: false, message: 'Perfil no encontrado.' });
        
        const adminId = admin[0].id_perfil_admin;

        await connection.query(
            'INSERT INTO anuncios (id_admin_fk, titulo, contenido, destinatarios) VALUES (?, ?, ?, ?)',
            [adminId, titulo, contenido, destinatarios || 'todos']
        );

        res.status(201).json({ success: true, message: 'Anuncio publicado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al publicar.' });
    } finally {
        if (connection) connection.release();
    }
};

const updateAnuncio = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, destinatarios } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(
            'UPDATE anuncios SET titulo=?, contenido=?, destinatarios=? WHERE id_anuncio=?',
            [titulo, contenido, destinatarios, id]
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

module.exports = {
    getAllAnuncios,
    getAnuncioById,
    createAnuncio,
    updateAnuncio,
    deleteAnuncio
};