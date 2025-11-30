/**
 * Zoho SMTP Email Service
 * 
 * Sends transactional emails via Zoho Mail SMTP.
 * Used for outreach email delivery in the GreenChainz platform.
 */

import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SendSmtpEmailParams, SendSmtpEmailResult } from '../types/outreach';

// =============================================================================
// Configuration
// =============================================================================

const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com';
const ZOHO_SMTP_PORT = parseInt(process.env.ZOHO_SMTP_PORT || '587', 10);
const ZOHO_SMTP_USER = process.env.ZOHO_SMTP_USER;
const ZOHO_SMTP_PASS = process.env.ZOHO_SMTP_PASS;
const ZOHO_FROM_EMAIL = process.env.ZOHO_FROM_EMAIL;
const ZOHO_FROM_NAME = process.env.ZOHO_FROM_NAME || 'GreenChainz';

// =============================================================================
// Transporter
// =============================================================================

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!ZOHO_SMTP_USER || !ZOHO_SMTP_PASS) {
    throw new Error('Zoho SMTP credentials not configured. Please set ZOHO_SMTP_USER and ZOHO_SMTP_PASS environment variables.');
  }

  transporter = nodemailer.createTransport({
    host: ZOHO_SMTP_HOST,
    port: ZOHO_SMTP_PORT,
    secure: ZOHO_SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: ZOHO_SMTP_USER,
      pass: ZOHO_SMTP_PASS,
    },
    tls: {
      // Allow self-signed certificates
      rejectUnauthorized: true,
    },
  });

  return transporter;
}

// =============================================================================
// Email Sending
// =============================================================================

export async function sendEmail(params: SendSmtpEmailParams): Promise<SendSmtpEmailResult> {
  const { to, subject, text, html, replyTo } = params;

  // Validate required fields
  if (!to || !subject || !text) {
    return {
      success: false,
      error: 'Missing required fields: to, subject, and text are required',
    };
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(to)) {
    return {
      success: false,
      error: 'Invalid email address format',
    };
  }

  // Check configuration
  if (!ZOHO_FROM_EMAIL) {
    return {
      success: false,
      error: 'ZOHO_FROM_EMAIL not configured',
    };
  }

  try {
    const transport = getTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${ZOHO_FROM_NAME}" <${ZOHO_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
      replyTo: replyTo || ZOHO_FROM_EMAIL,
    };

    const info = await transport.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${to}, messageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to send email to ${to}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// =============================================================================
// Test Connection
// =============================================================================

export async function verifySmtpConnection(): Promise<boolean> {
  if (!ZOHO_SMTP_USER || !ZOHO_SMTP_PASS || !ZOHO_FROM_EMAIL) {
    console.error('Zoho SMTP not configured');
    return false;
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Zoho SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ Zoho SMTP connection failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// =============================================================================
// Send Test Email
// =============================================================================

export async function sendTestEmail(toEmail: string): Promise<SendSmtpEmailResult> {
  return sendEmail({
    to: toEmail,
    subject: 'GreenChainz Outreach System - Test Email',
    text: `This is a test email from the GreenChainz Outreach System.

If you received this email, your SMTP configuration is working correctly.

Best regards,
GreenChainz Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: #065f46; color: #10b981; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ✅ TEST EMAIL
        </span>
      </div>
      
      <h1 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px; text-align: center;">
        SMTP Configuration Successful!
      </h1>
      
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
        This is a test email from the GreenChainz Outreach System.
        If you received this email, your SMTP configuration is working correctly.
      </p>
      
      <div style="background-color: #111827; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          Sent via Zoho SMTP
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} GreenChainz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

export default {
  sendEmail,
  verifySmtpConnection,
  sendTestEmail,
};
