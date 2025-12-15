import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';

// Memoized Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env['RESEND_API_KEY']) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env['RESEND_API_KEY']);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

/**
 * Sends a transactional email using Resend and React Email templates.
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = process.env['RESEND_FROM_EMAIL'] || 'GreenChainz <noreply@greenchainz.com>',
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResendClient();
    const html = await render(react);

    // Development Mode (No API Key)
    if (!resend) {
      console.log('---------------------------------------------------');
      console.log(`[DEV MODE] Email Sending Mocked`);
      console.log(`To: ${to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML Preview (first 500 chars): ${html.substring(0, 500)}...`);
      console.log('---------------------------------------------------');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error('Resend API Error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.data?.id };

  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
