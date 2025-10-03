// =============================================================
// API Routes v2.4 (con Health Check)
// =============================================================
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database.js');

// --- NUEVO: Endpoint de Health Check ---
router.get('/health', (req, res) => {
    try {
        const dbStatus = db.checkDbConnection();
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
        };
        res.status(200).json(healthStatus);
    } catch (error) {
        console.error("Error en el Health Check:", error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            details: 'El servidor está activo pero hay un problema con un servicio crítico.',
            database: { status: 'error', message: error.message }
        });
    }
});

const auth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado. Por favor, inicia sesión.' });
};

router.post(
  '/login',
  [
    body('username').isString().notEmpty().withMessage('El usuario es requerido.'),
    body('password').isString().notEmpty().withMessage('La contraseña es requerida.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      req.session.user = { username: username };
      res.status(200).json({ message: 'Inicio de sesión exitoso.' });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
  }
);

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      return next(err); 
    }
    res.clearCookie('kiosco.session');
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

router.post(
  '/tips', 
  [
    body('table_number').isString().notEmpty().isLength({ min: 1, max: 10 }).withMessage('El número de mesa es requerido.'),
    body('waiter_name').isString().notEmpty().withMessage('El nombre del mesero es requerido.'),
    body('tip_percentage').isInt({ min: 20, max: 25 }).isIn([20, 23, 25]).withMessage('Porcentaje de propina no válido.'),
    body('transaction_id').isString().notEmpty().withMessage('ID de transacción es requerido.')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const result = db.addTip({
        ...req.body,
        user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString()
      });
      res.status(201).json({ id: result.id, message: 'Propina registrada con éxito' });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log(`Transacción duplicada detectada y rechazada: ${req.body.transaction_id}`);
        return res.status(200).json({ message: 'Propina duplicada, ya registrada anteriormente.' });
      }
      next(error); 
    }
  }
);

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

router.get('/waiters', (req, res, next) => {
  try {
    const waiters = db.getWaiters();
    res.status(200).json(waiters);
  } catch (error) {
    next(error);
  }
});

module.exports = router;