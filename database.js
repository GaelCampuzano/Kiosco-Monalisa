// =============================================================
// Capa de acceso a datos (SQLite) para Propinas v2.2 (Final)
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
      user_agent TEXT,
      device_id TEXT,
      created_at TEXT NOT NULL
    );
  `;
  db.exec(createTipsTableStmt);
  db.exec('CREATE INDEX IF NOT EXISTS idx_created_at ON tips (created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_waiter_name ON tips (waiter_name);');
  
  console.log('Base de datos conectada y tabla "tips" asegurada.');
}

// Inicializar la base de datos al cargar el módulo
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
    const { table_number, waiter_name, tip_percentage, user_agent, device_id, created_at } = tipData;
    const stmt = db.prepare(
      'INSERT INTO tips (table_number, waiter_name, tip_percentage, user_agent, device_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(table_number, waiter_name, tip_percentage, user_agent, device_id, created_at);
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

module.exports = {
  db,
  getTips,
  addTip,
  getWaiters
};