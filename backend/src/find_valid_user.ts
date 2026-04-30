import { pool } from './config/db';

async function findUser() {
  try {
    const [rows]: any = await pool.query("SELECT email FROM users LIMIT 5");
    console.log("Valid users:", rows);
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    process.exit(0);
  }
}

findUser();
