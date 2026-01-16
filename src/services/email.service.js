const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('--- [EMAIL SERVICE DEBUG] Configuración Cargada ---');
console.log('HOST:', process.env.SMTP_HOST);
console.log('USER:', process.env.SMTP_USER);
console.log('PORT:', process.env.SMTP_PORT);
console.log('SECURE:', process.env.SMTP_SECURE);
console.log('---------------------------------------------------');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('[EMAIL SERVICE] Error Fatal al conectar con SMTP:', error);
    } else {
        console.log('[EMAIL SERVICE] Conexión SMTP establecida y lista.');
    }
});

const enviarCorreo = async (destinatario, asunto, htmlBody) => {
    console.log(`[EMAIL SERVICE] Intentando enviar a: ${destinatario}`);
    
    try {
        const info = await transporter.sendMail({
            from: `"Notificaciones Escolares" <${process.env.SMTP_USER}>`,
            to: destinatario,
            subject: asunto,
            html: htmlBody
        });
        
        console.log(`[EMAIL SERVICE] Enviado Correctamente.`);
        console.log(`   ID Mensaje: ${info.messageId}`);
        console.log(`   Respuesta Servidor: ${info.response}`);
        return true;

    } catch (error) {
        console.error('[EMAIL SERVICE] FALLÓ EL ENVÍO:');
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        console.error('   Detalles:', JSON.stringify(error, null, 2));
        return false;
    }
};

const baseStyle = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #4a4a4a;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid #f0f0f0;
`;

const headerStyle = (bgColor) => `
    background-color: ${bgColor};
    padding: 25px;
    text-align: center;
    color: white;
`;

const contentStyle = `padding: 30px 25px;`;

const footerStyle = `
    background-color: #fdfbf7;
    padding: 15px;
    text-align: center;
    font-size: 12px;
    color: #8c8c8c;
    border-top: 1px solid #eaeaea;
`;

const templates = {
    entrada: (nombre, hora) => `
        <div style="${baseStyle}">
            <div style="${headerStyle('#23A559')}">
                <h1 style="margin:0; font-size: 24px;">¡Llegada Exitosa!</h1>
            </div>
            <div style="${contentStyle}">
                <p style="font-size: 16px; margin-bottom: 20px;">Hola,</p>
                <p style="font-size: 16px; line-height: 1.5;">
                    Se ha registrado la entrada de <strong>${nombre}</strong> a las instalaciones de la escuela.
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #23A559; padding: 15px; margin: 20px 0;">
                    <p style="margin:0; color: #166534; font-weight: bold;">Hora de registro: ${hora}</p>
                </div>
                <a href="${process.env.APP_URL || '#'}/portal" style="display: inline-block; background-color: #ff8c69; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 10px;">Ver en el Portal</a>
            </div>
            <div style="${footerStyle}">Sistema de Asistencia Escolar</div>
        </div>
    `,
    salida: (nombre, hora) => `
        <div style="${baseStyle}">
            <div style="${headerStyle('#5865F2')}">
                <h1 style="margin:0; font-size: 24px;">Salida Registrada</h1>
            </div>
            <div style="${contentStyle}">
                <p style="font-size: 16px; line-height: 1.5;">
                    El alumno <strong>${nombre}</strong> ha salido de la escuela.
                </p>
                <div style="background-color: #eff6ff; border-left: 4px solid #5865F2; padding: 15px; margin: 20px 0;">
                    <p style="margin:0; color: #1e40af; font-weight: bold;">Hora de salida: ${hora}</p>
                </div>
            </div>
            <div style="${footerStyle}">Sistema de Asistencia Escolar</div>
        </div>
    `,
    retardo: (nombre, hora) => `
        <div style="${baseStyle}">
            <div style="${headerStyle('#F0B132')}">
                <h1 style="margin:0; font-size: 24px;">Entrada con Retardo</h1>
            </div>
            <div style="${contentStyle}">
                <p style="font-size: 16px; line-height: 1.5;">
                    <strong>${nombre}</strong> ha ingresado a la escuela después de la hora límite establecida.
                </p>
                <div style="background-color: #fefce8; border-left: 4px solid #F0B132; padding: 15px; margin: 20px 0;">
                    <p style="margin:0; color: #854d0e; font-weight: bold;">Hora de registro: ${hora}</p>
                </div>
            </div>
            <div style="${footerStyle}">Sistema de Asistencia Escolar</div>
        </div>
    `,
    falta: (nombre, fecha) => `
        <div style="${baseStyle}">
            <div style="${headerStyle('#DA373C')}">
                <h1 style="margin:0; font-size: 24px;">Aviso de Inasistencia</h1>
            </div>
            <div style="${contentStyle}">
                <p style="font-size: 16px; line-height: 1.5;">
                    Estimado tutor, no tenemos registro de entrada de <strong>${nombre}</strong> el día de hoy.
                </p>
                <div style="background-color: #fef2f2; border-left: 4px solid #DA373C; padding: 15px; margin: 20px 0;">
                    <p style="margin:0; color: #991b1b; font-weight: bold;">📅 Fecha: ${fecha}</p>
                </div>
                <p style="font-size: 14px; color: #8c8c8c;">Si consideras que esto es un error, por favor contacta a la administración.</p>
            </div>
            <div style="${footerStyle}">Sistema de Asistencia Escolar</div>
        </div>
    `,
    recovery: (link, color = '#5865F2') => `
        <div style="${baseStyle}">
            <div style="${headerStyle(color)}">
                <h1 style="margin:0; font-size: 24px;">Recuperar Contraseña</h1>
            </div>
            <div style="${contentStyle}">
                <p style="font-size: 16px; margin-bottom: 20px;">Hola,</p>
                <p style="font-size: 16px; line-height: 1.5;">
                    Hemos recibido una solicitud para restablecer tu contraseña.
                </p>
                <p style="font-size: 16px; line-height: 1.5;">
                    Haz clic en el siguiente botón para crear una nueva contraseña:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background-color: ${color}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
                </div>
                <p style="font-size: 12px; color: #999;">Este enlace es válido por 1 hora.</p>
                <p style="font-size: 12px; color: #999;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
            <div style="${footerStyle}">Sistema de Asistencia Escolar</div>
        </div>
    `
};

module.exports = { enviarCorreo, templates };