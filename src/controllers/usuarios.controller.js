const pool = require('../services/db.service');
const { deleteImage } = require('./utils.controller');

const getAllAdmins = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT 
                p.id_perfil_admin, p.nombre_completo, p.imagen_url,
                u.id_usuario, u.correo_electronico, u.telefono, u.esta_activo
            FROM perfil_admin p
            JOIN usuarios u ON p.id_usuario_fk = u.id_usuario
            ORDER BY p.nombre_completo`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    const idUsuarioActual = req.session.user.id;
    
    if (parseInt(id, 10) === idUsuarioActual) {
        return res.status(403).json({ success: false, message: 'No puedes eliminarte a ti mismo.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [perfilRows] = await connection.query(
            'SELECT p.imagen_url FROM perfil_admin p JOIN usuarios u ON p.id_usuario_fk = u.id_usuario WHERE u.id_usuario = ?',
            [id]
        );

        const [result] = await connection.query('DELETE FROM usuarios WHERE id_usuario = ? AND rol = "admin"', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado.' });
        }

        if (perfilRows.length > 0 && perfilRows[0].imagen_url) {
            await deleteImage(perfilRows[0].imagen_url);
        }
        
        res.status(200).json({ success: true, message: 'Administrador eliminado exitosamente (eliminación en cascada).' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getAllAdmins,
    deleteAdmin
};