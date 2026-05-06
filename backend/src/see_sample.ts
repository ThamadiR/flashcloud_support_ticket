import { pool } from "./config/db";

async function seeSampleData() {
  try {
    const [rows] = await pool.query("SELECT id, ticket_code, thread_id, sender_email, subject FROM tbl_ticket_email_det LIMIT 10");
    console.log("tbl_ticket_email_det sample:", rows);
    
    const [receiveRows] = await pool.query("SELECT id, ticket_id, sender, subject FROM tbl_email_receive LIMIT 10");
    console.log("tbl_email_receive sample:", receiveRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seeSampleData();
