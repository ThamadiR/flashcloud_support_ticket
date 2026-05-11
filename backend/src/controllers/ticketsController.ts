import type { Request, Response } from "express";
import {
  sendEmail,
  replyToEmail,
  forwardEmail,
} from "../services/emailService";
import { getTickets, getTicketById } from "../models/ticketsModel";

import { fetchAndSaveLatestEmails } from "../services/emailReceiver";

import { updateTicketById, deleteTicketById } from "../models/ticketsModel";
import { pool } from "../config/db";

export async function list(req: Request, res: Response) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 6);
    const search = (req.query.search as string) ?? "";
    const status = (req.query.status as string) ?? "";

    const userIdFilter = req.query.userId ? Number(req.query.userId) : null;

    const data = await getTickets(
      Number.isFinite(page) && page > 0 ? page : 1,
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 6,
      search,
      status,
      userIdFilter
    );

    res.json(data);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
}

export async function sendTicketEmail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const ticket = await getTicketById(Number(id));
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (!ticket.email)
      return res.status(400).json({ error: "Ticket has no associated email" });

    await sendEmail(ticket.email, subject, message);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
}

// Replying to an existing email
export async function replyEmail(req: Request, res: Response) {
  try {
    const { to, subject, replyMessage, inReplyToId, cc, fromUser } = req.body;

    const attachments = (
      (req as Request & { files?: { originalname: string; path: string }[] })
        .files ?? []
    ).map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    const info = await replyToEmail(
      to,
      subject,
      replyMessage,
      inReplyToId,
      attachments,
      fromUser,
      cc
    );

    const cleanSubj = subject.replace(/^(Re|Fw|Fwd|\[JIRA\]):\s*/i, "").trim();
    const [ticketRows]: any = await pool.query(
      "SELECT id FROM tbl_ticket_det WHERE id = ? OR subject = ? OR subject LIKE ? LIMIT 1",
      [Number(req.body.ticketId) || 0, cleanSubj, `%${cleanSubj}%`]
    );
    if (ticketRows.length > 0) {
      const ticketId = ticketRows[0].id;
      await pool.query(
        `INSERT INTO tbl_email_receive (ticket_id, sender, recipient, subject, body, date_received, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW(), 'sent', NOW())`,
        [
          ticketId,
          fromUser || process.env.EMAIL_USER || "support@flashcloud.com",
          to,
          subject,
          replyMessage,
        ]
      );
    }

    res.status(200).json({ message: "Reply sent successfully", info });
  } catch (err) {
    console.error("Error replying to email:", err);
    res.status(500).json({ error: "Failed to reply to email" });
  }
}

// Forwarding an existing email
export async function forwardEmailController(req: Request, res: Response) {
  try {
    const {
      to,
      subject,
      originalBody,
      forwardMessage,
      originalFrom,
      originalDate,
      originalTo,
      cc,
      fromUser,
    } = req.body;
    const files =
      (req as Request & { files?: { originalname: string; path: string }[] })
        .files ?? [];

    const attachments = files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    const info = await forwardEmail(
      to,
      subject,
      originalBody,
      forwardMessage,
      attachments,
      originalFrom,
      originalDate,
      originalTo,
      cc,
      fromUser
    );

    // Try to link this forward action to a ticket by ID or subject
    const safeSubject = subject || "";
    const cleanSubj = safeSubject.replace(/^(Re|Fw|Fwd|\[JIRA\]):\s*/i, "").trim();
    const [ticketRows]: any = await pool.query(
      "SELECT id FROM tbl_ticket_det WHERE id = ? OR subject = ? OR subject LIKE ? LIMIT 1",
      [Number(req.body.ticketId) || 0, cleanSubj, `%${cleanSubj}%`]
    );
    if (ticketRows.length > 0) {
      const ticketId = ticketRows[0].id;
      await pool.query(
        `INSERT INTO tbl_email_receive (ticket_id, sender, recipient, subject, body, date_received, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW(), 'forwarded', NOW())`,
        [
          ticketId,
          fromUser || process.env.EMAIL_USER || "support@flashcloud.com",
          to || "",
          safeSubject,
          forwardMessage,
        ]
      );
    }

    res.status(200).json({ message: "Email forwarded successfully", info });
  } catch (err: any) {
    console.error("Error forwarding email:", err);
    let errorMessage = err.message || "Failed to forward email";
    if (errorMessage.includes("Missing credentials") || errorMessage.includes("user")) {
      errorMessage = "Server error: Missing EMAIL_USER or EMAIL_PASS in backend/.env configuration. Please add them and restart the server.";
    }
    res.status(500).json({ error: errorMessage });
  }
}

// Update ticket details (state, priority, group_type, assignee)
export async function updateTicket(req: Request, res: Response) {
  console.log("!!! HIT updateTicket endpoint !!!");
  try {
    const { id } = req.params;
    console.log(`[DEBUG] updateTicket: body=`, req.body);
    const { state, priority, group_type, assignee, userId } = req.body;

    const updated = await updateTicketById(Number(id), {
      state,
      priority,
      group_type,
      assignee,
      userId,
    });

    if (!updated) {
      return res.status(400).json({ error: "No fields were updated" });
    }

    res.json({ message: "Ticket updated successfully" });
  } catch (err) {
    console.error("Error updating ticket:", err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
}

// Get emails by ticket id
export async function getEmailsByTicket(req: Request, res: Response) {
  try {
    const { ticketId } = req.params;

    // 1. Fetch ticket subject
    const [ticketRows]: any = await pool.query(
      "SELECT subject, author FROM tbl_ticket_det WHERE id = ?",
      [ticketId]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketSubject = ticketRows[0].subject || "";
    const cleanSubject = ticketSubject
      .replace(/^(Re|Fw|Fwd|\[JIRA\]):\s*/i, "")
      .trim();

    // 2. Fetch ticket codes from mst table
    const [mstRows]: any = await pool.query(
      "SELECT ticket_code FROM tbl_ticket_email_mst WHERE subject LIKE ? OR subject = ?",
      [`%${cleanSubject}%`, ticketSubject]
    );

    const ticketCodes: string[] = mstRows.map((m: any) => m.ticket_code);

    // 3. Fetch all sender emails for those ticket codes (no LIMIT)
    let requesterEmails: string[] = [];
    if (ticketCodes.length > 0) {
      const [senderRows]: any = await pool.query(
        "SELECT DISTINCT sender_email FROM tbl_ticket_email_det WHERE ticket_code IN (?)",
        [ticketCodes]
      );
      requesterEmails = senderRows
        .map((r: any) => r.sender_email)
        .filter(Boolean);
    }

    // 4. Build parallel queries
    const queries: Promise<any>[] = [
      // tbl_email_receive: match by ticket_id OR subject
      pool.query(
        `SELECT id, ticket_id, sender, recipient, cc, subject, body, attachments, date_received, status, message_id
         FROM tbl_email_receive
         WHERE ticket_id = ?
            OR subject LIKE ?
            OR subject = ?`,
        [ticketId, `%${cleanSubject}%`, ticketSubject]
      ),

      // tbl_ticket_det: match by ID or subject
      pool.query(
        `SELECT id, id as ticket_id, author as sender, '' as recipient, '' as cc,
                subject, '' as body, '[]' as attachments, created_at as date_received, status, '' as message_id
         FROM tbl_ticket_det
         WHERE id = ? OR subject LIKE ? OR subject = ?`,
        [Number(ticketId), `%${cleanSubject}%`, ticketSubject]
      ),
    ];

    // tbl_ticket_email_det: fetch ALL emails for found ticket codes
    if (ticketCodes.length > 0) {
      queries.push(
        pool.query(
          `SELECT id, ticket_code as ticket_id, sender_email as sender, recipient_email as recipient,
                  cc_email as cc, subject, body, '[]' as attachments, date_received, status, message_id
           FROM tbl_ticket_email_det
           WHERE ticket_code IN (?) OR ticket_code = ?`,
          [ticketCodes, Number(ticketId)]
        )
      );
    }

    // Also fetch by sender emails if we have them
    if (requesterEmails.length > 0) {
      queries.push(
        pool.query(
          `SELECT id, ticket_id, sender, recipient, cc, subject, body, attachments, date_received, status, message_id
           FROM tbl_email_receive
           WHERE sender IN (?) AND (subject LIKE ? OR subject = ?)`,
          [requesterEmails, `%${cleanSubject}%`, ticketSubject]
        )
      );
    }

    const results = await Promise.all(queries);
    console.log(`Backend: Queries completed for ticket ${ticketId}. Processing results...`);

    // 5. Merge all results
    const allRawEmails: any[] = [];
    results.forEach(([rows], idx) => {
      console.log(`Backend: Query ${idx} returned ${Array.isArray(rows) ? rows.length : 'not an array'} rows`);
      if (Array.isArray(rows)) allRawEmails.push(...rows);
    });

    console.log(
      `Email fetch stats for Ticket ${ticketId}: Total raw=${allRawEmails.length}`
    );

    // 6. Sort by date ascending
    const sortedEmails = allRawEmails.sort((a, b) => {
      return (
        new Date(a.date_received).getTime() -
        new Date(b.date_received).getTime()
      );
    });

    res.status(200).json(sortedEmails);
      } catch (err: any) {
        console.error("Error fetching ticket emails:", err);
        res
          .status(500)
          .json({ error: err.message || "Failed to fetch ticket emails" });
      }
    }

    export async function show(req: Request, res: Response) {
      try {
        const { id } = req.params;
        const ticket = await getTicketById(Number(id));
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });
        res.json(ticket);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        res.status(500).json({ error: "Failed to fetch ticket" });
      }
    }

    export async function deleteTicket(req: Request, res: Response) {
      try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
          return res.status(400).json({ error: "Invalid ticket ID" });
        }

        const success = await deleteTicketById(Number(id));
        if (!success) {
          return res.status(404).json({ error: "Ticket not found or already deleted" });
        }

        res.json({ message: "Ticket deleted successfully" });
      } catch (err) {
        console.error("Error deleting ticket:", err);
        res.status(500).json({ error: "Failed to delete ticket" });
      }
    }