const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
});
pool.getConnection()
  .then(connection => {
    console.log('Conectado a la base de datos');
    connection.release();
  })
  .catch(err => {
    console.error('Error de conexión a la BD:', err.message);
    process.exit(1);
  });

module.exports = pool;