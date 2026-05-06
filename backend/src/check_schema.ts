import { pool } from "./config/db";

async function checkSchema() {
  try {
    const [rows] = await pool.query("DESCRIBE tbl_email_receive");
    console.log("tbl_email_receive schema:", rows);
    
    const [ticketRows] = await pool.query("DESCRIBE tbl_ticket_det");
    console.log("tbl_ticket_det schema:", ticketRows);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
