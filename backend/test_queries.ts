import { pool } from './src/config/db';

async function test(id: number) {
  console.log('Testing ID:', id);
  try {
    console.log('Query 1...');
    const [rows1]: any = await pool.query(
      `SELECT id, ticket_id, sender, recipient, cc, subject, body, attachments, date_received, status, message_id
       FROM tbl_email_receive
       WHERE ticket_id = ?`,
      [id]
    );
    console.log('Query 1 done, rows:', rows1.length);

    const [ticketRows]: any = await pool.query('SELECT subject FROM tbl_ticket_det WHERE id = ?', [id]);
    console.log('Ticket rows:', ticketRows.length);

    if (ticketRows.length > 0) {
      const ticketSubject = ticketRows[0].subject;
      console.log('Subject:', ticketSubject);
      const cleanSubject = ticketSubject.replace(/^(Re|Fw|Fwd|\[JIRA\]):\s*/i, '').trim();

      console.log('Query 2 (MST)...');
      const [mstRows]: any = await pool.query(
        'SELECT ticket_code FROM tbl_ticket_email_mst WHERE subject LIKE ? OR subject = ?',
        [`%${cleanSubject}%`, ticketSubject]
      );
      console.log('Query 2 done, rows:', mstRows.length);

      if (mstRows.length > 0) {
        const ticketCodes = mstRows.map((m: any) => m.ticket_code);
        console.log('Codes:', ticketCodes);
        console.log('Query 3 (DET)...');
        const [detRows]: any = await pool.query(
          `SELECT id FROM tbl_ticket_email_det WHERE ticket_code IN (?)`,
          [ticketCodes]
        );
        console.log('Query 3 done, rows:', detRows.length);
      }
    }
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

test(632);
