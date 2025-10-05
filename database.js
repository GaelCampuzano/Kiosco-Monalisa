const path = require('path');
const Database = require('better-sqlite3');

// Creamos o abrimos la base de datos.
const db = new Database(path.join(__dirname, 'data', 'tips.db'));

// Esta función se encarga de crear la tabla de propinas si no existe.
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

  // Agregamos la columna transaction_id si no existe (para versiones antiguas).
  const columns = db.prepare("PRAGMA table_info(tips)").all();
  const hasTransactionIdCol = columns.some(col => col.name === 'transaction_id');

  if (!hasTransactionIdCol) {
    try {
      db.exec('ALTER TABLE tips ADD COLUMN transaction_id TEXT');
    } catch (error) {
      console.error("Error al añadir la columna transaction_id:", error);
    }
  }

  // Creamos índices para que las búsquedas sean más rápidas.
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_id ON tips (transaction_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_created_at ON tips (created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_waiter_name ON tips (waiter_name);');
  
  console.log('Base de datos conectada y tabla "tips" asegurada.');
}

setupDatabase();

// Obtenemos las propinas de la base de datos, con filtros opcionales.
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

// Agregamos una nueva propina a la base de datos.
function addTip(tipData) {
    const { table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at } = tipData;
    const stmt = db.prepare(
      'INSERT INTO tips (table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at);
    return { id: info.lastInsertRowid };
}

// Obtenemos la lista de meseros.
function getWaiters() {
  return [
    { name: 'David' },
    { name: 'Gael' },
    { name: 'Ivan' },
    { name: 'Luis' },
    { name: 'Emmanuel' },
  ];
}

// Verificamos que la conexión a la base de datos esté funcionando.
function checkDbConnection() {
  try {
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
  checkDbConnection
};