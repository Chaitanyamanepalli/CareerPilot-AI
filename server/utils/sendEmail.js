// ====================================================
// Email Service Utility (Nodemailer wrapper)
//
// This file initializes an SMTP email dispatch transporter.
// It is used to send password recovery reset links to users' emails.
//
// Features:
// - Supports Gmail services configuration.
// - Supports Custom SMTP hosts and ports.
// - Falls back to a free test Ethereal Email provider if no environment details are present.
//
// Used by:
// - authController.js (forgotPassword handler)
// ====================================================

const nodemailer = require('nodemailer');

// Purpose:
// Dispatches an email message using Nodemailer configuration.
//
// Input:
// options (Object) - contains { to, subject, text, html }.
//
// Output:
// Returns the Nodemailer message info on successful dispatch.
//
// Usage:
// Imported and called inside authController.js for forgotPassword reset links.
const sendEmail = async (options) => {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  // Strip spaces if Gmail app password has spacing like 'pget zwax hono seex'
  const emailPass = emailUser.includes('@gmail.com') ? rawPass.replace(/\s+/g, '') : rawPass;
  const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const emailPort = process.env.EMAIL_PORT || process.env.SMTP_PORT;
  const emailService = process.env.EMAIL_SERVICE;

  // For Gmail SMTP, sender address must match the authenticated account
  let emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (emailUser && emailUser.includes('@gmail.com')) {
    emailFrom = `CareerPilot AI <${emailUser}>`;
  } else if (!emailFrom) {
    emailFrom = `CareerPilot AI <${emailUser || 'no-reply@careerpilot.ai'}>`;
  }

  // 0) Use Resend HTTPS API if key is present to bypass SMTP port restrictions
  if (process.env.RESEND_API_KEY) {
    console.log('[EMAIL] RESEND_API_KEY detected. Dispatching via Resend HTTP API...');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend API');
      }

      console.log(`[EMAIL] Sent successfully via Resend. ID: ${data.id}`);
      return { messageId: data.id };
    } catch (err) {
      console.error('[EMAIL] Resend API Dispatch Error:', err.message);
      throw err;
    }
  }

  let transporter;

  // 1) Configure Transporter based on env settings
  if (emailUser && emailPass) {
    if (emailService === 'gmail' || emailHost === 'smtp.gmail.com' || (emailUser && emailUser.includes('@gmail.com'))) {
      // Highly reliable Gmail transporter setup
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else if (emailHost) {
      // Custom SMTP server configuration (e.g. Brevo, SendGrid, Mailgun, Amazon SES)
      const port = parseInt(emailPort || '587', 10);
      transporter = nodemailer.createTransport({
        host: emailHost,
        port,
        secure: port === 465,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    }
  } else {
    // Graceful dev fallback if credentials are not configured yet
    console.log('----------------------------------------------------');
    console.log('[EMAIL DEV MODE] No SMTP credentials configured in .env.');
    console.log(`Recipient: ${options.to}`);
    console.log(`Subject:   ${options.subject}`);
    console.log('To send real emails, set EMAIL_USER and EMAIL_PASS in server/.env');
    console.log('----------------------------------------------------');
    return { messageId: 'simulated-dev-id', simulated: true };
  }

  // 2) Define email options
  const mailOptions = {
    from: emailFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // 3) Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent successfully to ${options.to}: Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] Transmission error to ${options.to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
