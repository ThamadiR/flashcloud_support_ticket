import { pool } from "./config/db";

async function describeTables() {
  try {
    const tables = ["tbl_ticket_email_mst", "tbl_ticket_email_det", "tbl_email_receive", "tbl_ticket_det"];
    for (const table of tables) {
      const [cols] = await pool.query(`DESCRIBE ${table}`);
      console.log(`Schema for ${table}:`, cols);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

describeTables();
