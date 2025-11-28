const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../services/db.service');

const QR_SECRET = process.env.QR_SECRET || 'secreto_super_seguro_para_firmar_qrs';

const generateQRToken = async (req, res) => {
    try {
        const payload = {
            id: uuidv4(),
            timestamp: Date.now(),
            gate: 'principal'
        };

        const data = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
        
        const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64');

        res.status(200).json({ success: true, token: token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generando token' });
    }
};

const validateAndBurnToken = async (token, idAlumno) => {
    let connection;
    try {
        const jsonStr = Buffer.from(token, 'base64').toString();
        const { data, signature } = JSON.parse(jsonStr);
        const payload = JSON.parse(data);

        const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
        if (signature !== expectedSignature) {
            return { valid: false, message: 'QR Falso o manipulado.' };
        }

        const now = Date.now();
        const diff = (now - payload.timestamp) / 1000;
        if (diff > 30) {
            return { valid: false, message: 'El código QR ha caducado.' };
        }

        connection = await pool.getConnection();
        
        const [used] = await connection.query(
            'SELECT id FROM qr_logs WHERE qr_uuid = ? AND id_alumno_fk = ?', 
            [payload.id, idAlumno]
        );
        
        if (used.length > 0) {
            return { valid: false, message: 'Ya utilizaste este código QR. Espera al siguiente.' };
        }

        await connection.query('INSERT INTO qr_logs (qr_uuid, id_alumno_fk) VALUES (?, ?)', [payload.id, idAlumno]);

        return { valid: true };

    } catch (e) {
        return { valid: false, message: 'QR ilegible.' };
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    generateQRToken,
    validateAndBurnToken
};