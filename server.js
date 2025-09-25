// =============================================================
// Kiosco Sunset Monalisa - Servidor Express
// -------------------------------------------------------------
// Este servidor expone una API para:
//  - Registrar propinas desde el kiosco público (endpoint público)
//  - Consultar y exportar propinas (endpoints protegidos por Basic Auth)
//  - Servir archivos estáticos del frontend (público y admin)
//
// Seguridad:
//  - Las rutas GET están protegidas con Basic Auth usando ADMIN_USER y ADMIN_PASS
//  - Las rutas públicas validan los datos de entrada
//
// Notas de implementación:
//  - Base de datos: SQLite (better-sqlite3) administrada en `database.js`
//  - CORS habilitado para permitir consultas del dashboard/admin
// =============================================================
// 1. Importación de módulos
require('dotenv').config();
const express = require('express');
const basicAuth = require('basic-auth');
const cors = require('cors'); // <-- 1. IMPORTAR CORS
const db = require('./database.js'); 

// 2. Inicialización y configuración
const app = express();
const port = process.env.PORT || 3000;

// 3. Middlewares
app.use(cors()); // <-- 2. USAR CORS
app.use(express.json());
app.use(express.static('public'));

// 4. Configuración de la Base de Datos
db.setupDatabase();

// 5. Middleware de Autenticación
/**
 * Middleware de autenticación Basic Auth para proteger rutas de administración.
 * Requiere variables de entorno ADMIN_USER y ADMIN_PASS.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const auth = (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== process.env.ADMIN_USER || user.pass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
  next();
};

// 6. Rutas de la API (sin cambios)

// --- Endpoint para CREAR un registro (Público) ---
/**
 * Crea un registro de propina.
 * Público: no requiere autenticación.
 * Valida: table_number, waiter_name, tip_percentage ∈ {20,23,25}.
 *
 * Body JSON esperado:
 * {
 *   table_number: string,
 *   waiter_name: string,
 *   tip_percentage: 20|23|25,
 *   device_id?: string
 * }
 */
app.post('/api/tips', (req, res) => {
  try {
    const { table_number, waiter_name, tip_percentage } = req.body;

    if (!table_number || !waiter_name || !tip_percentage) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }
    if (![20, 23, 25].includes(tip_percentage)) {
      return res.status(400).json({ error: 'Porcentaje de propina no válido.' });
    }
    
    // Persistir en la base de datos (se agregan metadatos del request)
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

// --- Endpoint para LEER registros (Protegido) ---
/**
 * Devuelve registros de propinas filtrados y ordenados por fecha descendente.
 * Protegido por Basic Auth.
 *
 * Query params opcionales:
 *  - startDate: ISO date (yyyy-mm-dd)
 *  - endDate: ISO date (yyyy-mm-dd)
 *  - waiterName: string (búsqueda parcial)
 */
app.get('/api/tips', auth, (req, res) => {
  try {
    const tips = db.getTips(req.query);
    res.status(200).json(tips);
  } catch (error) {
    console.error('Error al consultar propinas:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- Endpoint para EXPORTAR registros a CSV (Protegido) ---
/**
 * Exporta los registros de propinas como archivo CSV.
 * Protegido por Basic Auth.
 * Aplica los mismos filtros que GET /api/tips.
 */
app.get('/api/tips/csv', auth, (req, res) => {
  try {
    const tips = db.getTips(req.query);

    if (tips.length === 0) {
      return res.status(404).json({ error: 'No hay registros para exportar.' });
    }

    // Construcción del CSV (escape de comillas y formato local de fecha)
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
