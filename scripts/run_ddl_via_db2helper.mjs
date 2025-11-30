import fs from 'fs/promises';
import path from 'path';

// Dynamically import the DB2 helper (works with ESM projects)
const db2HelperPath = path.resolve(new URL(import.meta.url).pathname, '..', '..', 'lib', 'db2.js').replace(/^\//, '/');

async function run() {
  try {
    const { connectDB2 } = await import(db2HelperPath);

    const sqlPath = path.resolve(new URL(import.meta.url).pathname, '..', '..', 'db', 'sql', 'create_jobs_spool_tables.sql').replace(/^\//, '/');
    const sql = await fs.readFile(sqlPath, 'utf8');

    // Split statements by semicolon and execute individually
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Read SQL file: ${sqlPath}`);
    console.log(`Found ${statements.length} statements to execute.`);

    const conn = await connectDB2();
    try {
      for (const stmt of statements) {
        console.log('Executing statement:\n', stmt.slice(0, 300));
        try {
          await conn.query(stmt);
        } catch (err) {
          console.error('Statement failed (continuing):', err && err.message ? err.message : String(err));
        }
      }
    } finally {
      try { await conn.close(); } catch (e) {}
    }

    console.log('DDL run complete.');
  } catch (err) {
    console.error('Error running DDL via DB2 helper:', err);
    process.exit(1);
  }
}

run();
