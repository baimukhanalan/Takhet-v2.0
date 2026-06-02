const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required to run functional schema migrations.');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultation_signals (
        id BIGSERIAL PRIMARY KEY,
        case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        sender_role TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice', 'leave')),
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_consultation_signals_case_id_id
        ON consultation_signals(case_id, id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_consultation_signals_created_at
        ON consultation_signals(created_at);
    `);
    await client.query('COMMIT');
    console.log('Functional schema migration completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
