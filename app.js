const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const allApiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'ZdpaCVH26y4u44V0q0CSWibcGpW4Y7xZ',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', allApiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/alerts', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'alerts', 'index.html'));
});

app.get('/history', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'history', 'index.html'));
});

app.get('/qrCode', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'qrCode', 'index.html'));
});

app.get('/dataAlumno', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'dataAlumno.html'));
});

app.get('/dataTutor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'dataTutor.html'));
});

app.get('/regisAlumno', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'regisAlumno.html'));
});

app.get('/regisTutor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'regisTutor.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});