const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('Error de conexion SMTP:', error);
    } else {
        console.log('Servidor SMTP conectado exitosamente.');
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: to,
            subject: subject,
            html: html,
        });
        console.log('Mensaje enviado ID:', info.messageId);
        return { success: true, message: 'Correo enviado' };
    } catch (error) {
        console.error('Error critico al enviar correo:', error);
        return { success: false, message: 'Error al enviar correo' };
    }
};

module.exports = {
    sendEmail
};