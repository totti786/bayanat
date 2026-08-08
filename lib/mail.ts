import "server-only";

import nodemailer from "nodemailer";

const HOST = process.env.SMTP_HOST;

export function emailConfigured(): boolean {
  return Boolean(HOST);
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<boolean> {
  if (!HOST) return false;
  const transporter = nodemailer.createTransport({
    host: HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bayanat <no-reply@bayanat.app>",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType ?? "application/pdf",
    })),
  });

  return true;
}
