import { pool } from "./config/db";

async function checkTicket640Full() {
  try {
    const [rows] = await pool.query("SELECT * FROM tbl_ticket_det WHERE id = 640");
    console.log("Ticket 640 full data:", rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTicket640Full();
