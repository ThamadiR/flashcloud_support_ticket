import { pool } from "./config/db";

async function searchBySubject() {
  try {
    const subject = "Fw: Response time SLA violated - Agent Not Visible in Supervisor Console and Recordings Display Issue";
    const [receiveRows] = await pool.query("SELECT * FROM tbl_email_receive WHERE subject LIKE ?", [`%${subject}%`]);
    console.log("tbl_email_receive match:", receiveRows);
    
    const [detRows] = await pool.query("SELECT * FROM tbl_ticket_email_det WHERE subject LIKE ?", [`%${subject}%`]);
    console.log("tbl_ticket_email_det match:", detRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

searchBySubject();
