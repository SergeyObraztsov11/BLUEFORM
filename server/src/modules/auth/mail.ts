import nodemailer from 'nodemailer'

export async function sendVerificationCode(email: string, otp: string) {
  const host = process.env.SMTP_HOST
  if (!host) throw new Error('SMTP_HOST is required to send verification codes')

  const port = Number(process.env.SMTP_PORT || 1025)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  })
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'BLUEFORM <noreply@blueform.local>',
    to: email,
    subject: 'Код подтверждения BLUEFORM',
    text: `Код подтверждения BLUEFORM: ${otp}. Он действует 5 минут.`,
  })
}
