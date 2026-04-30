
import pool from './src/config/db';

async function main() {
  console.log("Checking companyList table...");
  try {
    const [rows] = await pool.execute('SELECT * FROM companyList');
    console.log('COMPANIES FOUND:', rows);
    
    if (Array.isArray(rows) && rows.length === 0) {
      console.log('The companyList table is EMPTY.');
    }
  } catch(e: any) {
    console.error('DATABASE ERROR:', e.message);
  } finally {
    await pool.end();
  }
}

main();
