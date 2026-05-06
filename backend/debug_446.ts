import { pool } from './src/config/db';

async function debugTicket(id: number) {
  console.log(`--- Debugging Ticket ${id} ---`);
  
  // 1. tbl_ticket_det
  const [ticketDet]: any = await pool.query('SELECT * FROM tbl_ticket_det WHERE id = ?', [id]);
  console.log('tbl_ticket_det:', ticketDet);
  
  // 2. tbl_email_receive
  const [emailsReceive]: any = await pool.query('SELECT id, ticket_id, subject FROM tbl_email_receive WHERE ticket_id = ?', [id]);
  console.log('tbl_email_receive (count):', emailsReceive.length);
  
  // 3. tickets
  const [ticketsTable]: any = await pool.query('SELECT id, subject FROM tickets WHERE id = ?', [id]);
  console.log('tickets table:', ticketsTable);
  
  // 4. Try to find ticket_code if any
  // Some tables use ticket_code instead of id. Let's see if we can find a code.
  // Search in tbl_ticket_email_mst for subject
  if (ticketDet.length > 0) {
    const subject = ticketDet[0].subject;
    const [mst]: any = await pool.query('SELECT * FROM tbl_ticket_email_mst WHERE subject = ?', [subject]);
    console.log('tbl_ticket_email_mst (by subject):', mst);
    
    if (mst.length > 0) {
      const code = mst[0].ticket_code;
      const [det]: any = await pool.query('SELECT id, sender_email, subject FROM tbl_ticket_email_det WHERE ticket_code = ?', [code]);
      console.log('tbl_ticket_email_det (by code):', det.length);
    }
  }

  process.exit(0);
}

debugTicket(446);
