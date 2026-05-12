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
    const user = (req as any).user;
    const role = (user?.role || "").toUpperCase().replace(/[-\s]+/g, '_');
    const userId = user?.id;

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 6);
    const search = (req.query.search as string) ?? "";
    const status = (req.query.status as string) ?? "";

    let userIdFilter = req.query.userId ? Number(req.query.userId) : null;

    // Enforcement: Ticket agents can ONLY see their own tickets
    if (role === "TICKET_AGENT") {
      userIdFilter = userId;
    }

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
      "SELECT ticket_code FROM tbl_ticket_email_det WHERE id = ? OR subject = ? OR subject LIKE ? LIMIT 1",
      [Number(req.body.ticketId) || 0, cleanSubj, `%${cleanSubj}%`]
    );
    if (ticketRows.length > 0) {
      const ticketCode = ticketRows[0].ticket_code;
      const [detResult]: any = await pool.query(
        `INSERT INTO tbl_ticket_email_det (ticket_code, sender_email, recipient_email, subject, body, date_received, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW(), 'replied', NOW())`,
        [
          ticketCode,
          fromUser || process.env.EMAIL_USER || "support@flashcloud.com",
          to,
          subject,
          replyMessage,
        ]
      );

      const detailId = detResult.insertId;

      // Save attachments to tbl_ticket_attachment
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await pool.query(
            `INSERT INTO tbl_ticket_attachment 
             (ticket_code, file_name, file_path)
             VALUES (?, ?, ?)`,
            [ticketCode, att.filename, att.path]
          );
        }
      }
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
      "SELECT ticket_code FROM tbl_ticket_email_det WHERE id = ? OR subject = ? OR subject LIKE ? LIMIT 1",
      [Number(req.body.ticketId) || 0, cleanSubj, `%${cleanSubj}%`]
    );
    if (ticketRows.length > 0) {
      const ticketCode = ticketRows[0].ticket_code;
      const [detResult]: any = await pool.query(
        `INSERT INTO tbl_ticket_email_det (ticket_code, sender_email, recipient_email, subject, body, date_received, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW(), 'forwarded', NOW())`,
        [
          ticketCode,
          fromUser || process.env.EMAIL_USER || "support@flashcloud.com",
          to || "",
          safeSubject,
          `<div>${forwardMessage}</div><br/><hr/><br/>
           <div>
             <strong>---------- Forwarded Message ----------</strong><br/>
             <strong>From:</strong> ${originalFrom}<br/>
             <strong>Date:</strong> ${originalDate}<br/>
             <strong>Subject:</strong> ${safeSubject}<br/>
             <strong>To:</strong> ${originalTo}<br/><br/>
             ${originalBody}
           </div>`,
        ]
      );

      const detailId = detResult.insertId;

      // Save attachments to tbl_ticket_attachment
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await pool.query(
            `INSERT INTO tbl_ticket_attachment 
             (ticket_code, file_name, file_path)
             VALUES (?, ?, ?)`,
            [ticketCode, att.filename, att.path]
          );
        }
      }
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

    // 1. Fetch ticket subject and code
    const [ticketRows]: any = await pool.query(
      "SELECT subject, ticket_code FROM tbl_ticket_email_mst WHERE id = ?",
      [ticketId]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketSubject = ticketRows[0].subject || "";
    const ticketCode = ticketRows[0].ticket_code || "";
    const cleanSubject = ticketSubject
      .replace(/^(Re|Fw|Fwd|\[JIRA\]):\s*/i, "")
      .trim();

    // 2. Fetch related ticket codes (to find entire thread)
    const [mstRows]: any = await pool.query(
      "SELECT ticket_code FROM tbl_ticket_email_mst WHERE subject LIKE ? OR subject = ?",
      [`%${cleanSubject}%`, ticketSubject]
    );

    const ticketCodes: string[] = mstRows.map((m: any) => m.ticket_code);
    if (ticketCode && !ticketCodes.includes(ticketCode)) {
      ticketCodes.push(ticketCode);
    }

    // 3. Fetch ALL emails for found ticket codes
    const [emails]: any = await pool.query(
      `SELECT id, ticket_code as ticket_id, sender_email as sender, recipient_email as recipient,
              cc_email as cc, subject, body, date_received, status, message_id
       FROM tbl_ticket_email_det
       WHERE ticket_code IN (?) OR ticket_code = ?
       ORDER BY date_received ASC`,
      [ticketCodes.length > 0 ? ticketCodes : [ticketCode || ticketId], ticketCode || ticketId]
    );

    // 4. Fetch ALL attachments for these ticket codes
    const [attachmentRows]: any = await pool.query(
      `SELECT file_name, file_path
       FROM tbl_ticket_attachment
       WHERE ticket_code IN (?) OR ticket_code = ?`,
      [ticketCodes.length > 0 ? ticketCodes : [ticketCode || ticketId], ticketCode || ticketId]
    );

    // 5. Map attachments to emails (Attach all to first email since per-message link is missing in schema)
    const emailsWithAttachments = emails.map((email: any, index: number) => {
      const emailAttachments = index === 0 ? attachmentRows.map((att: any) => ({
        filename: att.file_name,
        path: att.file_path,
        url: att.file_path
      })) : [];

      return {
        ...email,
        attachments: JSON.stringify(emailAttachments)
      };
    });

    res.status(200).json(emailsWithAttachments);
  } catch (err: any) {
    console.error("Error fetching ticket emails:", err);
    res.status(500).json({ error: err.message || "Failed to fetch ticket emails" });
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