// =============================================================
// Kiosco Sunset Monalisa - Servidor Express
// -------------------------------------------------------------

// 1. Importación de módulos
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const db = require('./database.js');
const apiRoutes = require('./routes/api');

// 2. Inicialización y configuración
const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production'; // Variable para detectar entorno

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 3.1. Configuración de Sesión MEJORADA
app.use(session({
  name: 'kiosco.session', // <-- NOMBRE DE COOKIE PERSONALIZADO
  secret: process.env.SESSION_SECRET || 'un-secreto-muy-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // <-- `true` solo en producción (https)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 día de duración
  }
}));

// 4. Configuración de la Base de Datos
db.setupDatabase();

// 5. Rutas de la API
app.use('/api', apiRoutes);

// 6. Middleware para manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

// 7. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`Dashboard disponible en http://localhost:${port}/admin.html`);
});