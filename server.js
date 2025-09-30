// =============================================================
// Kiosco Sunset Monalisa - Servidor Express
// -------------------------------------------------------------
// ... (comentarios sin cambios)
// =============================================================

// 1. Importación de módulos
require('dotenv').config();
const express = require('express'); // <-- CORREGIDO
const session = require('express-session');
const cors = require('cors');
const db = require('./database.js');

// 2. Inicialización y configuración
const app = express();
const port = process.env.PORT || 3000;

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 3.1. Configuración de Sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'un-secreto-muy-seguro', // Usa una variable de entorno en producción
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en producción (https)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 día de duración
  }
}));

// 4. Configuración de la Base de Datos
db.setupDatabase();

// 5. Middleware de Autenticación (modificado para usar sesiones)
const auth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado. Por favor, inicia sesión.' });
};


// 6. Rutas de la API (con nuevas rutas de login/logout)

// --- Endpoint para INICIAR SESIÓN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    // Guardar usuario en la sesión
    req.session.user = { username: username };
    res.status(200).json({ message: 'Inicio de sesión exitoso.' });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
});

// --- Endpoint para CERRAR SESIÓN ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar la sesión.' });
    }
    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
  });
});

// --- Endpoint para VERIFICAR SESIÓN ---
app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ loggedIn: true });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});


// --- Endpoint para CREAR un registro (Público) ---
// (sin cambios)
app.post('/api/tips', (req, res) => {
  try {
    const { table_number, waiter_name, tip_percentage } = req.body;

    if (!table_number || !waiter_name || !tip_percentage) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }
    if (![20, 23, 25].includes(tip_percentage)) {
      return res.status(400).json({ error: 'Porcentaje de propina no válido.' });
    }
    
    const result = db.addTip({
      ...req.body,
      user_agent: req.headers['user-agent'],
      created_at: new Date().toISOString()
    });

    res.status(201).json({ id: result.id, message: 'Propina registrada con éxito' });
  } catch (error) {
    console.error('Error al registrar propina:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- Endpoint para LEER registros (Protegido con sesión) ---
app.get('/api/tips', auth, (req, res) => {
  try {
    const tips = db.getTips(req.query);
    res.status(200).json(tips);
  } catch (error) {
    console.error('Error al consultar propinas:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- Endpoint para EXPORTAR registros a CSV (Protegido con sesión) ---
app.get('/api/tips/csv', auth, (req, res) => {
  try {
    const tips = db.getTips(req.query);

    if (tips.length === 0) {
      return res.status(404).json({ error: 'No hay registros para exportar.' });
    }

    const headers = ['ID', 'Mesa', 'Mesero', 'Propina (%)', 'Fecha y Hora'];
    const csvRows = [
      headers.join(','),
      ...tips.map(tip => [
        tip.id,
        `"${tip.table_number.replace(/"/g, '""')}"`,
        `"${tip.waiter_name.replace(/"/g, '""')}"`,
        tip.tip_percentage,
        `"${new Date(tip.created_at).toLocaleString()}"`
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_propinas.csv"');
    res.status(200).send(csvString);

  } catch (error) {
    console.error('Error al exportar a CSV:', error.message);
    res.status(500).json({ error: 'Error al generar el CSV.' });
  }
});


// 7. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`Dashboard disponible en http://localhost:${port}/admin.html`);
});