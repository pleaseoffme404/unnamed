const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const allApiRoutes = require('./src/routes');
const { isAuthenticated } = require('./src/middlewares/auth.middleware');

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

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password', 'index.html'));
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

app.get('/announcements', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'announcements', 'index.html'));
});

app.get('/historial', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'historial', 'index.html'));
});

app.get('/scanQR', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scanQR', 'index.html'));
});

app.get('/alumnos', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'alumnos', 'index.html'));
});

app.get('/alumnos/register', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'alumnos', 'register', 'index.html'));
});

app.get('/tutores', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tutores', 'index.html'));
});

app.get('/tutores/register', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tutores', 'register', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});