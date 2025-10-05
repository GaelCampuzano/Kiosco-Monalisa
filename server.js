// Cargamos las variables de entorno desde el archivo .env
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const BetterSqlite3Store = require('better-sqlite3-session-store')(session);
const cors = require('cors');
const db = require('./database.js').db;
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Configuramos los middlewares de Express.
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuramos el almacenamiento de sesiones en la base de datos.
const sessionStore = new BetterSqlite3Store({
  client: db,
  concurrentDB: true,
  table: 'sessions',
});

// Configuramos el middleware de sesiones.
app.use(session({
  store: sessionStore,
  name: 'kiosco.session',
  secret: process.env.SESSION_SECRET || '1LSKNOU4VCIFO560234IM3P6IJETPZQQ',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 día
  }
}));

// Usamos las rutas de la API.
app.use('/api', apiRoutes);

// Manejamos los errores de la aplicación.
app.use((err, req, res, next) => {
  console.error(err.stack);
  const errorResponse = {
    error: 'Ocurrió un error interno en el servidor.'
  };
  if (!isProduction) {
    errorResponse.details = err.message;
  }
  res.status(500).json(errorResponse);
});

// Iniciamos el servidor.
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`Dashboard disponible en http://localhost:${port}/admin.html`);
});