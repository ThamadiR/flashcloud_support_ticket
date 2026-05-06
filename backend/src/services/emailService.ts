import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/*const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your mail server
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
}*/

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

export async function sendEmail(to: string, subject: string, message: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Replying to an existing email
export async function replyToEmail(
  to: string,
  originalSubject: string,
  replyMessage: string,
  inReplyToId?: string,
  attachments: any[] = []
) {
  try {
    const subject = originalSubject.startsWith("Re:")
      ? originalSubject
      : `Re: ${originalSubject}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: replyMessage,
      html: `<p>${replyMessage}</p>`,
      inReplyTo: inReplyToId, // Optional (helps email clients thread replies)
      references: inReplyToId ? [inReplyToId] : [],
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Reply email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error replying to email:", error);
    throw error;
  }
}

// Forward an existing email
export async function forwardEmail(
  to: string,
  originalSubject: string,
  originalBody: string,
  forwardMessage?: string,
  attachments: any[] = [],
  originalFrom?: string,
  originalDate?: string,
  originalTo?: string
) {
  try {
    const subject = originalSubject.startsWith("Fwd:")
      ? originalSubject
      : `Fwd: ${originalSubject}`;

    const combinedMessage = `
      <p>${forwardMessage || "Forwarded message:"}</p>
      <hr/>
      <p>----------- Forwarded message -----------</p>
      <p><strong>From:</strong> ${originalFrom}</p>
      <p><strong>Date:</strong> ${originalDate}</p>
      <p><strong>Subject:</strong> ${originalSubject}</p>
      <p><strong>To:</strong> ${originalTo}</p>
      <blockquote>${originalBody}</blockquote>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: combinedMessage,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Forwarded email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error forwarding email:", error);
    throw error;
  }
}
