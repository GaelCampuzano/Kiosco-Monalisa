// =============================================================
// Capa de acceso a datos (SQLite) v2.5 (con Health Check)
// =============================================================
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data', 'tips.db'));

function setupDatabase() {
  const createTipsTableStmt = `
    CREATE TABLE IF NOT EXISTS tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL,
      waiter_name TEXT NOT NULL,
      tip_percentage INTEGER NOT NULL,
      transaction_id TEXT,
      user_agent TEXT,
      device_id TEXT,
      created_at TEXT NOT NULL
    );
  `;
  db.exec(createTipsTableStmt);

  const columns = db.prepare("PRAGMA table_info(tips)").all();
  const hasTransactionIdCol = columns.some(col => col.name === 'transaction_id');

  if (!hasTransactionIdCol) {
    try {
      db.exec('ALTER TABLE tips ADD COLUMN transaction_id TEXT');
      console.log('Migración: Columna transaction_id añadida exitosamente.');
    } catch (error) {
      console.error("Error durante la migración al añadir la columna:", error);
    }
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_id ON tips (transaction_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_created_at ON tips (created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_waiter_name ON tips (waiter_name);');
  
  console.log('Base de datos conectada y tabla "tips" asegurada.');
}

setupDatabase();

function getTips({ startDate, endDate, waiterName } = {}) {
    let query = 'SELECT * FROM tips';
    const params = [];
  
    if (startDate || endDate || waiterName) {
      query += ' WHERE 1=1';
      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(endDate + 'T23:59:59.999Z');
      }
      if (waiterName) {
        query += ' AND waiter_name LIKE ?';
        params.push(`%${waiterName}%`);
      }
    }
    
    query += ' ORDER BY created_at DESC';
  
    const stmt = db.prepare(query);
    return stmt.all(params);
}

function addTip(tipData) {
    const { table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at } = tipData;
    const stmt = db.prepare(
      'INSERT INTO tips (table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at);
    return { id: info.lastInsertRowid };
}

function getWaiters() {
  return [
    { name: 'David' },
    { name: 'Gael' },
    { name: 'Ivan' },
    { name: 'Luis' },
    { name: 'Emmanuel' },
  ];
}

// --- NUEVA FUNCIÓN ---
function checkDbConnection() {
  try {
    // Realiza una consulta simple que no consume muchos recursos.
    db.prepare('SELECT 1').get();
    return { status: 'ok', message: 'Conexión exitosa.' };
  } catch (error) {
    console.error("Fallo en la conexión a la DB:", error.message);
    throw new Error('No se pudo conectar a la base de datos.');
  }
}

module.exports = {
  db,
  getTips,
  addTip,
  getWaiters,
  checkDbConnection // <-- Se exporta la nueva función
};