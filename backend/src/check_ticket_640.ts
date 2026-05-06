import { pool } from "./config/db";

async function checkTicket640() {
  try {
    const [mstRows] = await pool.query("SELECT * FROM tbl_ticket_email_mst WHERE ticket_id = 640");
    console.log("mst rows for ticket 640:", mstRows);
    
    if ((mstRows as any[]).length > 0) {
      const mstId = (mstRows as any[])[0].id;
      const [detRows] = await pool.query("SELECT * FROM tbl_ticket_email_det WHERE mst_id = ?", [mstId]);
      console.log("det rows for mst_id " + mstId + ":", detRows);
    } else {
      console.log("No mst record for ticket 640");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTicket640();
