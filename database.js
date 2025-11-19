const { sql } = require('@vercel/postgres');

// Inicialización de la base de datos (Tablas)
async function setupDatabase() {
  try {
    // Tabla de propinas
    await sql`
      CREATE TABLE IF NOT EXISTS tips (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(10) NOT NULL,
        waiter_name VARCHAR(50) NOT NULL,
        tip_percentage INTEGER NOT NULL,
        transaction_id VARCHAR(100) UNIQUE,
        user_agent TEXT,
        device_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Tabla de sesiones (necesaria para connect-pg-simple)
    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `;
    
    // Añadir restricción de clave primaria a la tabla de sesiones si no existe
    // (Un truco para evitar errores si ya existe la tabla sin PK)
    try {
      await sql`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE`;
    } catch (e) {
      // Ignoramos si ya existe la constraint
    }

    console.log('Base de datos (Postgres) configurada correctamente.');
  } catch (error) {
    console.error('Error configurando la DB:', error);
  }
}

// Ejecutamos la configuración inicial
setupDatabase();

// Obtener propinas con filtros
async function getTips({ startDate, endDate, waiterName } = {}) {
    let query = 'SELECT * FROM tips WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(startDate);
    }
    if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        // Ajuste para incluir todo el día final
        params.push(endDate + ' 23:59:59');
    }
    if (waiterName) {
        query += ` AND waiter_name ILIKE $${paramIndex++}`; // ILIKE es insensible a mayúsculas
        params.push(`%${waiterName}%`);
    }
    
    query += ' ORDER BY created_at DESC';

    // Ejecutamos la consulta con parámetros dinámicos
    const { rows } = await sql.query(query, params);
    return rows;
}

// Agregar nueva propina
async function addTip(tipData) {
    const { table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at } = tipData;
    
    try {
        // Postgres usa RETURNING id para devolver el ID generado
        const { rows } = await sql`
            INSERT INTO tips (table_number, waiter_name, tip_percentage, transaction_id, user_agent, device_id, created_at)
            VALUES (${table_number}, ${waiter_name}, ${tip_percentage}, ${transaction_id}, ${user_agent}, ${device_id}, ${created_at})
            RETURNING id;
        `;
        return { id: rows[0].id };
    } catch (error) {
        // Manejo de error por duplicados (transaction_id unique)
        if (error.code === '23505') { // Código de error Postgres para unique violation
             console.warn('Propina duplicada detectada');
             return { duplicate: true };
        }
        throw error;
    }
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

async function checkDbConnection() {
  try {
    await sql`SELECT 1`;
    return { status: 'ok', message: 'Conexión exitosa a Postgres.' };
  } catch (error) {
    console.error("Fallo en la conexión a la DB:", error.message);
    throw new Error('No se pudo conectar a la base de datos.');
  }
}

module.exports = {
  getTips,
  addTip,
  getWaiters,
  checkDbConnection
};