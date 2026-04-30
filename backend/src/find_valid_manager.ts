import { pool } from './config/db';

async function findManager() {
  try {
    const [rows]: any = await pool.query("SELECT email FROM Management LIMIT 5");
    console.log("Valid managers:", rows);
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    process.exit(0);
  }
}

findManager();
