const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const allApiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 1200; 

app.use(cors({
    origin: `http://localhost:${PORT}`, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] Solicitud: ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        const logBody = { ...req.body };
        if(logBody.password) logBody.password = '*****';
        if(logBody.contrasena) logBody.contrasena = '*****';
        console.log('   > Datos:', JSON.stringify(logBody));
    }
    next();
});

app.use(session({
    name: 'sid_escolar',
    secret: process.env.SESSION_SECRET || 'secreto_default_dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use('/api', allApiRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto: ${PORT}`);
    console.log(`   - Local Web:    http://localhost:${PORT}`);
    console.log(`   - Android Emu:  http://10.0.2.2:${PORT}/api`);
    console.log(`   - Android Fis:  http://192.168.100.141:${PORT}/api`);
    console.log(`   - QR Secret:    ${process.env.QR_SECRET ? 'Cargado desde .env' : 'Usando Default (Inseguro)'}`);
});