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

// Configuración de sesiones con Postgres
app.use(session({
  store: new pgSession({
    // connect-pg-simple usará automáticamente POSTGRES_URL del .env
    tableName: 'session',
    createTableIfMissing: true 
  }),
  name: 'kiosco.session',
  secret: process.env.SESSION_SECRET || 'secreto-temporal-cambiar-en-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // true solo en https (producción)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 día
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