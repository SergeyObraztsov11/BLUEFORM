import nodemailer from 'nodemailer';

export async function sendVerificationCode(email: string, otp: string) {
  await sendShopMail({
    to: email,
    subject: 'Код подтверждения BLUEFORM',
    text: `Код подтверждения BLUEFORM: ${otp}. Он действует 5 минут.`,
    fallbackLog: `Verification code for ${email}: ${otp}`,
  });
}

export async function sendShopMail(input: {
  to: string;
  subject: string;
  text: string;
  fallbackLog?: string;
}) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (input.fallbackLog) console.info(input.fallbackLog);
    else console.info(`Mail skipped (${input.subject}) → ${input.to}`);
    return;
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
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'BLUEFORM <noreply@blueform.local>',
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
}
