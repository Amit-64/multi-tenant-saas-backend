const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const runMigrations = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    
    const { rows: appliedRows } = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const appliedSet = new Set(appliedRows.map((row) => row.filename));

    
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[SKIP] ${file} (already applied)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`[APPLYING] ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[SUCCESS] ${file} applied.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[FAILED] ${file} rolled back:`, err.message);
        throw err;
      }
    }

    console.log('All migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});