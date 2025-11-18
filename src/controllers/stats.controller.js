const pool = require('../services/db.service');

const getCounts = async (req, res) => {
    try {
        const [alumnosResult] = await pool.query('SELECT COUNT(*) as total FROM Alumnos');
        const [tutoresResult] = await pool.query('SELECT COUNT(*) as total FROM Tutores');
        const [anunciosResult] = await pool.query('SELECT COUNT(*) as total FROM Alerta');

        res.json({
            alumnos: alumnosResult[0].total,
            tutores: tutoresResult[0].total,
            anuncios: anunciosResult[0].total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCounts
};