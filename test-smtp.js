require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
    console.log('\n--- 1. VERIFICACIÓN DE VARIABLES DE ENTORNO ---');
    console.log(`SMTP_HOST:   ${process.env.SMTP_HOST || '❌ FALTA'}`);
    console.log(`SMTP_PORT:   ${process.env.SMTP_PORT || '❌ FALTA'}`);
    console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE || '❌ FALTA'}`);
    console.log(`SMTP_USER:   ${process.env.SMTP_USER || '❌ FALTA'}`);
    console.log(`SMTP_PASS:   ${process.env.SMTP_PASS ? '****** (Cargado)' : '❌ FALTA'}`);
    
    console.log('\n--- 2. INICIANDO TRANSPORTE CON DEBUG ---');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,  // Muestra el tráfico SMTP crudo
        logger: true  // Imprime logs detallados en consola
    });

    try {
        console.log('\n--- 3. VERIFICANDO CONEXIÓN (VERIFY) ---');
        await transporter.verify();
        console.log('✅ Conexión con el servidor SMTP establecida correctamente.');

        console.log('\n--- 4. INTENTANDO ENVIAR CORREO ---');
        const info = await transporter.sendMail({
            from: `"Test Debug" <${process.env.SMTP_USER}>`,
            to: 'tutor@bullnodes.com',
            subject: 'Prueba de Diagnóstico SMTP 🛠️',
            text: 'Si lees esto, el envío funciona. Revisa los logs de consola para ver la transacción SMTP.',
            html: '<h1 style="color:green;">Prueba Exitosa</h1><p>El sistema de correos funciona.</p>'
        });

        console.log('\n--- 5. RESULTADO ---');
        console.log('✅ Correo enviado exitosamente.');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);

    } catch (error) {
        console.error('\n❌ ERROR FATAL DETECTADO ❌');
        console.error('Código:', error.code);
        console.error('Comando:', error.command);
        console.error('Mensaje:', error.message);
        
        if (error.code === 'EAUTH') console.error('💡 PISTA: Usuario o contraseña incorrectos.');
        if (error.code === 'ESOCKET') console.error('💡 PISTA: Error de conexión (Host/Puerto incorrecto o Firewall bloqueando).');
        if (error.code === 'EDNS') console.error('💡 PISTA: El host no se puede resolver (Revisa SMTP_HOST).');
    }
})();