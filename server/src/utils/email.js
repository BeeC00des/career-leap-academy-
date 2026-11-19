import nodemailer from 'nodemailer';

let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendResetEmail(to, name, url) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[mail] SMTP not configured. Password reset link for ${to}:\n${url}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || 'CareerLeap <no-reply@career-leap.academy>',
    to,
    subject: 'Reset your CareerLeap password',
    text: `Hi ${name},\n\nReset your password using the link below (valid for 1 hour):\n${url}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p>Reset your password using the link below (valid for 1 hour):</p><p><a href="${url}">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}
