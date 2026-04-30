import type { Request, Response } from "express";
import {
  sendEmail,
  replyToEmail,
  forwardEmail,
} from "../services/emailService";
import { getTickets, getTicketById } from "../models/ticketsModel";

import { fetchAndSaveLatestEmails } from "../services/emailReceiver";

import { updateTicketById } from "../models/ticketsModel";
import { pool } from "../config/db";

export async function list(req: Request, res: Response) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 6);
    const search = (req.query.search as string) ?? "";

    const data = await getTickets(
      Number.isFinite(page) && page > 0 ? page : 1,
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 6,
      search
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
    const { to, subject, replyMessage, inReplyToId } = req.body;

    // Handle attachments if any
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
      attachments
    );
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
    } = req.body;
    const files =
      (req as Request & { files?: { originalname: string; path: string }[] })
        .files ?? [];

    // Convert uploaded files into nodemailer attachment objects
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
      originalDate
    );
    res.status(200).json({ message: "Email forwarded successfully", info });
  } catch (err) {
    console.error("Error forwarding email:", err);
    res.status(500).json({ error: "Failed to forward email" });
  }
}

//update ticket details (state, priority, group_type, assignee)
export async function updateTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { state, priority, group_type, assignee } = req.body;

    const updated = await updateTicketById(Number(id), {
      state,
      priority,
      group_type,
      assignee,
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

//get emails by ticket id
export async function getEmailsByTicket(req: Request, res: Response) {
  try {
    //await fetchAndSaveLatestEmails();

    const { ticketId } = req.params;

    const [rows] = await pool.query(
      `SELECT *
       FROM tbl_email_receive
       WHERE ticket_id = ?
       ORDER BY date_received ASC`,
      [ticketId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching ticket emails:", err);
    res.status(500).json({ error: "Failed to fetch ticket emails" });
  }
}
