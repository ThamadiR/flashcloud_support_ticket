import { pool } from "./config/db";

async function checkData() {
  try {
    const [rows] = await pool.query("SELECT * FROM tbl_email_receive LIMIT 5");
    console.log("tbl_email_receive data:", rows);
    
    const [ticketRows] = await pool.query("SELECT * FROM tbl_ticket_det WHERE id = 640");
    console.log("Ticket 640 data:", ticketRows);
    
    const [emailForTicket] = await pool.query("SELECT * FROM tbl_email_receive WHERE ticket_id = 640");
    console.log("Emails for ticket 640:", emailForTicket);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
