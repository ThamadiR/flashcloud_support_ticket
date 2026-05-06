import { pool } from "./config/db";

async function checkOtherTables() {
  try {
    const [mstSchema] = await pool.query("DESCRIBE tbl_ticket_email_mst");
    console.log("tbl_ticket_email_mst schema:", mstSchema);
    
    const [detSchema] = await pool.query("DESCRIBE tbl_ticket_email_det");
    console.log("tbl_ticket_email_det schema:", detSchema);
    
    const [mstData] = await pool.query("SELECT * FROM tbl_ticket_email_mst LIMIT 5");
    console.log("tbl_ticket_email_mst data:", mstData);
    
    const [detData] = await pool.query("SELECT * FROM tbl_ticket_email_det LIMIT 5");
    console.log("tbl_ticket_email_det data:", detData);

    const [detForTicket] = await pool.query("SELECT * FROM tbl_ticket_email_det WHERE ticket_id = 640");
    console.log("Emails in det for ticket 640:", detForTicket);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOtherTables();
