import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libPath = path.join(__dirname, '..', 'lib', 'db2.js');
console.log('Using DB helper at', libPath);

try {
  const db = await import(libPath);
  if (!db || typeof db.connectDB2 !== 'function') {
    console.error('connectDB2 not exported from', libPath);
    process.exit(2);
  }

  console.log('Attempting to connect to DB2...');
  const conn = await db.connectDB2();
  try {
    const rows = await conn.query("SELECT TABSCHEMA, TABNAME FROM SYSCAT.TABLES WHERE TABSCHEMA NOT LIKE 'SYS%' FETCH FIRST 20 ROWS ONLY");
    console.log('Sample tables:', rows.slice(0,10));
  } finally {
    try { await conn.close(); } catch (e) {}
  }
  console.log('DB2 helper test succeeded');
  process.exit(0);
} catch (err) {
  console.error('DB2 helper test failed:', err && err.message ? err.message : err);
  process.exit(1);
}
