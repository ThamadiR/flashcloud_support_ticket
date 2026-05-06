import { pool } from "./config/db";

async function checkTicket348() {
  try {
    const subject = "Nipuna Bhashitha, you have work due in Jira";
    const [rows] = await pool.query("SELECT * FROM tbl_ticket_email_det WHERE subject LIKE ?", [`%${subject}%`]);
    console.log("tbl_ticket_email_det for 348 subject:", rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTicket348();
