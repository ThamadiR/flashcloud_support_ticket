import Imap from "imap";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import { pool } from "../config/db";
import fs from "fs";
import path from "path";

dotenv.config();

// IMAP CONFIG
const imapConfig = {
  user: process.env.EMAIL_USER || "",
  xoauth2: process.env.EMAIL_PASS || "",
  host: "outlook.office365.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

if (!imapConfig.user || !imapConfig.xoauth2) {
  console.warn(
    "WARNING: EMAIL_USER and EMAIL_PASS not set in .env. Email synchronization will be disabled.",
  );
}

const extractNameAndEmail = (addr: any) => {
  if (!addr || !addr.value || addr.value.length === 0) {
    return { name: "", email: "" };
  }

  const first = addr.value[0];

  return {
    name: first.name || "",
    email: first.address || "",
  };
};

export const fetchAndSaveLatestEmails = () => {
  if (!imapConfig.user || !imapConfig.xoauth2) {
    return Promise.resolve(true);
  }
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: imapConfig.user,
      password: "",
      xoauth2: Buffer.from(
        `user=${imapConfig.user}\x01auth=Bearer ${imapConfig.xoauth2}\x01\x01`,
      ).toString("base64"),
      host: imapConfig.host,
      port: imapConfig.port,
      tls: true,
      tlsOptions: imapConfig.tlsOptions,
    });

    const openInbox = (cb: any) => {
      imap.openBox("INBOX", false, cb);
    };

    imap.once("ready", () => {
      openInbox(async (err: any, box: any) => {
        if (err) return reject(err);

        console.log("IMAP Connected. Total Emails:", box.messages.total);

        imap.search(["ALL"], (err: any, results: any[]) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            console.log("No emails found.");
            imap.end();
            return resolve(true);
          }

          const f = imap.fetch(results, { bodies: "", struct: true });

          f.on("message", (msg: any) => {
            let buffer = "";

            msg.on("body", (stream: any) => {
              stream.on("data", (chunk: any) => {
                buffer += chunk.toString("utf8");
              });
            });

            msg.once("end", async () => {
              const parsed = await simpleParser(buffer);

              //Email threading headers
              const messageId = parsed.messageId || null;

              const inReplyTo = Array.isArray(parsed.inReplyTo)
                ? parsed.inReplyTo[0]
                : parsed.inReplyTo || null;

              //Duplicate check
              if (messageId) {
                const [rows] = await pool.query(
                  `SELECT id FROM tbl_ticket_email_mst WHERE message_id = ? LIMIT 1`,
                  [messageId],
                );

                if ((rows as any[]).length > 0) {
                  console.log(`Skipped duplicate email: ${messageId}`);
                  return;
                }
              }

              const formatAddr = (addr: any): string => {
                if (!addr) return "";
                if (Array.isArray(addr))
                  return addr
                    .map((a: any) => a?.text || a?.address || "")
                    .join(", ");
                return addr.text || addr.address || "";
              };

              //Thread ID Resolution
              let threadId = messageId;

              if (inReplyTo) {
                const [parentRows] = await pool.query(
                  `SELECT thread_id FROM tbl_ticket_email_mst WHERE message_id = ? LIMIT 1`,
                  [inReplyTo],
                );

                if ((parentRows as any[]).length > 0) {
                  threadId = (parentRows as any[])[0].thread_id;
                }
              }

              //Ticket Resolution
              let ticketId: number | null = null;

              if (threadId) {
                const [ticketByThread]: any = await pool.query(
                  `SELECT ticket_code FROM tbl_ticket_email_mst WHERE thread_id = ? AND ticket_code IS NOT NULL LIMIT 1`,
                  [threadId]
                );
                if (ticketByThread.length > 0) {
                  ticketId = ticketByThread[0].ticket_code;
                }
              }

              const attachmentsFolder = path.join(__dirname, "../../uploads");
              if (!fs.existsSync(attachmentsFolder))
                fs.mkdirSync(attachmentsFolder, { recursive: true });

              const attachmentsPaths =
                parsed.attachments
                  ?.filter((a: any) => {
                    // Must have a filename to be considered an attachment
                    if (!a.filename) return false;
                    return true;
                  })
                  .map((a: any) => {
                    const safeFilename = `${Date.now()}-${a.filename.replace(
                      /\s+/g,
                      "_",
                    )}`;
                    const filePath = path.join(attachmentsFolder, safeFilename);

                    fs.writeFileSync(filePath, a.content);

                    return {
                      filename: a.filename,
                      storedName: safeFilename,
                      mimeType: a.contentType,
                      size: a.size,
                      path: `/uploads/${safeFilename}`,
                    };
                  }) || null;

              const sender = extractNameAndEmail(parsed.from);

              const emailData = {
                from: sender.email,
                fromName: sender.name,
                to: formatAddr(parsed.to),
                cc: formatAddr(parsed.cc),
                subject: parsed.subject || "(No Subject)",
                body: parsed.html || parsed.text || "",
                attachments: attachmentsPaths
                  ? JSON.stringify(attachmentsPaths)
                  : null,
                date: parsed.date ? new Date(parsed.date) : new Date(),
              };

              //-----------company Resolution-----------//
              const senderDomain = emailData.from.split("@")[1] || "";
              let companyName = senderDomain
                ? senderDomain.split(".")[0].charAt(0).toUpperCase() +
                  senderDomain.split(".")[0].slice(1)
                : "Unknown";

              const [companyRows]: any = await pool.query(
                `SELECT id FROM companies WHERE name = ? LIMIT 1`,
                [companyName],
              );

              if (companyRows.length === 0) {
                await pool.query(
                  `INSERT INTO companies (name, email)
                  VALUES (?, ?)`,
                  [companyName, emailData.from],
                );
              }

              // -------- Contact Resolution --------
              const [contactRows]: any = await pool.query(
                `SELECT id FROM contacts WHERE email = ? LIMIT 1`,
                [emailData.from],
              );

              if (contactRows.length === 0) {
                const nameParts = emailData.fromName
                  ? emailData.fromName.split(" ")
                  : ["Unknown"];

                const firstName = nameParts[0] || "Unknown";
                const lastName = nameParts.slice(1).join(" ") || "";

                await pool.query(
                  `INSERT INTO contacts
                  (first_name, last_name, email, company)
                  VALUES (?, ?, ?, ?)`,
                  [firstName, lastName, emailData.from, companyName],
                );
              }

              try {
                await pool.query(
                  `INSERT INTO tbl_ticket_email_mst
                  (
                    sender,
                    recipient,
                    cc,
                    subject,
                    body,
                    attachments,
                    date_received,
                    status,
                    message_id,
                    in_reply_to,
                    thread_id,
                    ticket_code
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    emailData.from,
                    emailData.to,
                    emailData.cc,
                    emailData.subject,
                    emailData.body,
                    emailData.attachments,
                    emailData.date,
                    "unread",
                    messageId,
                    inReplyTo,
                    threadId,
                    ticketId,
                  ],
                );

                console.log(`Saved email: ${emailData.subject}`);
              } catch (dbErr: any) {
                console.error("DB Error:", dbErr);
              }

              // -------- Ticket Creation --------
              if (!ticketId) {
                const [ticketResult]: any = await pool.query(
                  `INSERT INTO tbl_ticket_email_det
                  (
                    subject,
                    status,
                    author,
                    priority,
                    group_type,
                    state,
                    company,
                    created_at
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                  [
                    emailData.subject,
                    "open",
                    emailData.fromName || "Unknown Sender",
                    "medium",
                    "Tech Support",
                    "Open",
                    companyName,
                  ],
                );

                ticketId = ticketResult.insertId;

                await pool.query(
                  `UPDATE tbl_ticket_email_det 
                  SET ticket_code = ?
                  WHERE thread_id = ? AND ticket_code IS NULL`,
                  [ticketId, threadId]
                );
              }
            });
          });

          f.once("end", () => {
            console.log("Finished fetching emails.");
            imap.end();
            resolve(true);
          });
        });
      });
    });

    imap.once("error", (err: any) => {
      reject("IMAP Error: " + err);
    });

    imap.connect();
  });
};
