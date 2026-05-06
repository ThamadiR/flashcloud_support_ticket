import { pool } from "./config/db";

async function checkTicketCode() {
  try {
    const [detRows] = await pool.query("SELECT * FROM tbl_ticket_email_det WHERE ticket_code = '640' OR thread_id LIKE '%640%'");
    console.log("det rows for ticket 640 by code/thread:", detRows);
    
    const [mstRows] = await pool.query("SELECT * FROM tbl_ticket_email_mst WHERE ticket_code = '640'");
    console.log("mst rows for ticket 640 by code:", mstRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTicketCode();
