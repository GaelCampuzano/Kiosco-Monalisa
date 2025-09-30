// =============================================================
// Kiosco Sunset Monalisa - Rutas de la API
// =============================================================
const express = require('express');
const router = express.Router();
const db = require('../database.js');

// --- Middleware de Autenticación ---
const auth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado. Por favor, inicia sesión.' });
};

// --- Rutas de Sesión ---

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.user = { username: username };
    res.status(200).json({ message: 'Inicio de sesión exitoso.' });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      return next(err); 
    }
    res.clearCookie('connect.sid'); // El nombre por defecto, se puede cambiar
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
  });
});

router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ loggedIn: true });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// --- Rutas de Propinas (Tips) ---

router.post('/tips', (req, res, next) => { 
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
    next(error); 
  }
});

router.get('/tips', auth, (req, res, next) => {
  try {
    const tips = db.getTips(req.query);
    res.status(200).json(tips);
  } catch (error) {
    next(error);
  }
});

router.get('/tips/csv', auth, (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;