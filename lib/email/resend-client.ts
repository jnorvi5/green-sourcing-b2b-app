/**
 * Resend Email Client
 *
 * Wrapper for Resend API to send transactional emails with scheduling support.
 * Used for user onboarding sequences and automated follow-ups.
 */

import { Resend } from 'resend';

// =============================================================================
// Client Configuration
// =============================================================================

let resendClient: Resend | null = null;

/**
 * Gets or creates a Resend client instance.
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured');
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

// =============================================================================
// Types
// =============================================================================

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  scheduledAt?: Date; // ISO 8601 date string for scheduled sending
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Email Sending Functions
// =============================================================================

/**
 * Sends an email via Resend.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const client = getResendClient();

    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@greenchainz.com';
    const fromName = process.env.RESEND_FROM_NAME || 'GreenChainz';

    // Prepare email payload
    const emailPayload: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
      scheduledAt?: string;
      tags?: Array<{ name: string; value: string }>;
    } = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Add scheduled date if provided (Resend expects ISO 8601 string)
    if (options.scheduledAt) {
      emailPayload.scheduledAt = options.scheduledAt.toISOString();
    }

    // Add tags if provided
    if (options.tags) {
      emailPayload.tags = options.tags;
    }

    // Send email
    const { data, error } = await client.emails.send(emailPayload);

    if (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log(`📧 Email sent via Resend: ${options.subject} to ${options.to}`);
    if (options.scheduledAt) {
      console.log(`   Scheduled for: ${options.scheduledAt.toISOString()}`);
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends multiple emails in batch.
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

// =============================================================================
// Export Client
// =============================================================================

const resendClientModule = { sendEmail, sendBatchEmails, getResendClient };

export { getResendClient };
export default resendClientModule;
