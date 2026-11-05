import nodemailer from 'nodemailer';
import { mailAttempts } from './metrics';

export async function sendVerificationCode(email: string, otp: string) {
  await sendShopMail({
    to: email,
    subject: 'Код подтверждения BLUEFORM',
    text: `Код подтверждения BLUEFORM: ${otp}. Он действует 5 минут.`,
  });
}

export async function sendShopMail(input: { to: string; subject: string; text: string }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    mailAttempts.inc({ outcome: 'error' });
    throw new Error('SMTP_HOST is required to send mail');
  }

  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'BLUEFORM <noreply@blueform.local>',
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    mailAttempts.inc({ outcome: 'success' });
  } catch (error) {
    mailAttempts.inc({ outcome: 'error' });
    throw error;
  }
}
