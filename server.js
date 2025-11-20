require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================================================================
// 🚨 CORRECCIÓN CRÍTICA AQUÍ 🚨
// Esta ruta debe ir ANTES del app.use(session(...))
// Responde "pong" sin intentar tocar la base de datos de Neon.
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});
// ==================================================================

// Configuración de sesiones con Postgres
// (Si Neon está dormido, esto podría fallar, pero ya no bloqueará el chequeo de internet)
app.use(session({
  store: new pgSession({
    tableName: 'session',
    createTableIfMissing: true,
    conObject: {
      connectionString: process.env.POSTGRES_URL,
      ssl: true // Neon requiere SSL
    }
  }),
  name: 'kiosco.session',
  secret: process.env.SESSION_SECRET || 'secreto-temporal-cambiar-en-prod',
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
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
    details: isProduction ? null : err.message
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});