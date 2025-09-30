// =============================================================
// Kiosco Sunset Monalisa - Servidor Express v2.3 (Final y Corregido)
// =============================================================
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

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de Sesión con la propiedad correcta
const sessionStore = new BetterSqlite3Store({
  client: db, // <-- CORRECCIÓN: La propiedad se llama 'client', no 'db'.
  concurrentDB: true,
  table: 'sessions',
});

app.use(session({
  store: sessionStore,
  name: 'kiosco.session',
  secret: process.env.SESSION_SECRET || 'un-secreto-muy-seguro-y-largo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use('/api', apiRoutes);

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

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`Dashboard disponible en http://localhost:${port}/admin.html`);
});