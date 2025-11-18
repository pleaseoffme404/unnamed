const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Sistema de Asistencia" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
        });
        return { success: true, message: 'Correo enviado' };
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return { success: false, message: 'Error al enviar correo' };
    }
};

module.exports = {
    sendEmail
};