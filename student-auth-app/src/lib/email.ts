import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER || process.env.EMAIL_USER || 'innetcreations@gmail.com';
const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || 'wbuzwcwoiwenvgeb';
const defaultFrom = process.env.SMTP_FROM || `"Student Automation System" <${user}>`;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

export async function sendOTP(email: string, otp: string, purpose: 'registration' | 'login' | 'reset' = 'registration') {
  let title = 'Verification Code';
  let badgeColor = '#6366f1';
  let purposeDescription = 'complete your verification';

  if (purpose === 'registration') {
    title = 'Verify Your Student Account';
    purposeDescription = 'complete your student account registration';
  } else if (purpose === 'login') {
    title = 'Login Verification Code';
    badgeColor = '#06b6d4';
    purposeDescription = 'verify your identity and log in';
  } else if (purpose === 'reset') {
    title = 'Password Reset Request';
    badgeColor = '#f59e0b';
    purposeDescription = 'reset your password';
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f111a; color: #f1f5f9; padding: 24px; margin: 0; }
      .card { max-width: 520px; margin: 0 auto; background: #1a1d2d; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.2); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .header { background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
      .content { padding: 32px 28px; text-align: center; }
      .badge { display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.15); color: ${badgeColor}; border: 1px solid ${badgeColor}; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
      .lead { color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
      .otp-box { background: #0c0e17; border: 2px dashed ${badgeColor}; border-radius: 12px; padding: 20px; margin: 24px 0; }
      .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.4); }
      .notice { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 24px; }
      .footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>Student Automation System</h1>
      </div>
      <div class="content">
        <div class="badge">${title}</div>
        <p class="lead">Use the secure 6-digit One-Time Password below to ${purposeDescription}:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p class="notice">This code is valid for <strong>10 minutes</strong>. Never share this OTP with anyone.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Student Automation System. Biometric & Identity Secured Portal.
      </div>
    </div>
  </body>
  </html>
  `;

  return transporter.sendMail({
    from: defaultFrom,
    to: email,
    subject: `[${otp}] Your Verification Code — Student Automation System`,
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html,
  });
}
