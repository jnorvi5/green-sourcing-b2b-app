/**
 * Resend Email Service Wrapper
 *
 * A reusable, typed utility for sending emails via Resend API.
 * Implements strict TypeScript typing, robust error handling, and proper secret management.
 */

import { Resend } from 'resend';
import { z } from 'zod';

// =============================================================================
// Configuration & Validation
// =============================================================================

const FROM_EMAIL = 'GreenChainz <noreply@greenchainz.com>';

/**
 * Gets the Resend API key from environment.
 */
function getApiKey(): string {
  return process.env.RESEND_API_KEY ?? '';
}

/**
 * Validates that Resend is properly configured.
 */
function isConfigured(): boolean {
  return Boolean(getApiKey());
}

// =============================================================================
// Type Definitions
// =============================================================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendBulkEmailResult {
  success: boolean;
  messageIds?: string[];
  successCount: number;
  failureCount: number;
  errors?: Array<{
    recipient: string;
    error: string;
  }>;
}

// =============================================================================
// Input Validation Schemas
// =============================================================================

const emailSchema = z.string().email();
const emailArraySchema = z.array(z.string().email()).min(1);
const subjectSchema = z.string().min(1).max(200);
const htmlSchema = z.string().min(1);

// =============================================================================
// Resend Client Singleton
// =============================================================================

let resendInstance: Resend | null = null;

/**
 * Gets or creates the Resend client instance.
 */
function getResendClient(): Resend {
  if (!resendInstance) {
    if (!isConfigured()) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }
    resendInstance = new Resend(getApiKey());
  }
  return resendInstance;
}

/**
 * Resets the Resend client instance (for testing purposes).
 * @internal
 */
export function __resetResendClient(): void {
  resendInstance = null;
}

// =============================================================================
// Public API Functions
// =============================================================================

/**
 * Sends a single email using Resend.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content of the email
 * @returns Promise with success status and message ID or error
 *
 * @example
 * ```typescript
 * const result = await sendEmail(
 *   'user@example.com',
 *   'Welcome to GreenChainz',
 *   '<h1>Welcome!</h1><p>Thank you for joining.</p>'
 * );
 *
 * if (result.success) {
 *   console.log('Email sent:', result.messageId);
 * } else {
 *   console.error('Failed to send email:', result.error);
 * }
 * ```
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  // Validate inputs
  const toValidation = emailSchema.safeParse(to);
  if (!toValidation.success) {
    const error = 'Invalid recipient email address';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  const subjectValidation = subjectSchema.safeParse(subject);
  if (!subjectValidation.success) {
    const error = 'Invalid subject: must be 1-200 characters';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  const htmlValidation = htmlSchema.safeParse(html);
  if (!htmlValidation.success) {
    const error = 'Invalid HTML content: must not be empty';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  // Development mode fallback
  if (!isConfigured()) {
    console.log('[DEV] Resend email would be sent:', {
      from: FROM_EMAIL,
      to,
      subject,
    });
    return {
      success: true,
      messageId: `dev-resend-${Date.now()}`,
    };
  }

  try {
    const resend = getResendClient();

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    // Handle Resend's response format
    if (response.error) {
      const errorMessage = `Resend API error: ${response.error.message}`;
      console.error('[Resend] Send failed:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!response.data?.id) {
      const errorMessage = 'Resend API returned no message ID';
      console.error('[Resend] Send failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`✅ Resend email sent to ${to}, messageId: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to send Resend email to ${to}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends the same email to multiple recipients using Resend batch API.
 * Falls back to sequential sending if batch API is not available.
 *
 * @param recipients - Array of recipient email addresses
 * @param subject - Email subject line
 * @param html - HTML content of the email
 * @returns Promise with batch send results
 *
 * @example
 * ```typescript
 * const result = await sendBulkEmail(
 *   ['user1@example.com', 'user2@example.com'],
 *   'Newsletter',
 *   '<h1>Latest Updates</h1>'
 * );
 *
 * console.log(`Sent ${result.successCount}, failed ${result.failureCount}`);
 * ```
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<SendBulkEmailResult> {
  // Validate inputs
  const recipientsValidation = emailArraySchema.safeParse(recipients);
  if (!recipientsValidation.success) {
    const error = 'Invalid recipients: must be a non-empty array of valid email addresses';
    console.error('[Resend] Validation error:', error);
    return {
      success: false,
      successCount: 0,
      failureCount: recipients.length,
      errors: recipients.map((recipient) => ({ recipient, error })),
    };
  }

  const subjectValidation = subjectSchema.safeParse(subject);
  if (!subjectValidation.success) {
    const error = 'Invalid subject: must be 1-200 characters';
    console.error('[Resend] Validation error:', error);
    return {
      success: false,
      successCount: 0,
      failureCount: recipients.length,
      errors: recipients.map((recipient) => ({ recipient, error })),
    };
  }

  const htmlValidation = htmlSchema.safeParse(html);
  if (!htmlValidation.success) {
    const error = 'Invalid HTML content: must not be empty';
    console.error('[Resend] Validation error:', error);
    return {
      success: false,
      successCount: 0,
      failureCount: recipients.length,
      errors: recipients.map((recipient) => ({ recipient, error })),
    };
  }

  // Development mode fallback
  if (!isConfigured()) {
    console.log('[DEV] Resend bulk email would be sent:', {
      from: FROM_EMAIL,
      recipients,
      subject,
    });
    return {
      success: true,
      messageIds: recipients.map((_, i) => `dev-resend-bulk-${Date.now()}-${i}`),
      successCount: recipients.length,
      failureCount: 0,
    };
  }

  try {
    const resend = getResendClient();

    // Use Resend batch API
    const batchPayload = recipients.map((recipient) => ({
      from: FROM_EMAIL,
      to: recipient,
      subject,
      html,
    }));

    const response = await resend.batch.send(batchPayload);

    // Handle Resend's batch response format
    if (response.error) {
      const errorMessage = `Resend batch API error: ${response.error.message}`;
      console.error('[Resend] Batch send failed:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!response.data?.data) {
      const errorMessage = 'Resend batch API returned no data';
      console.error('[Resend] Batch send failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const messageIds = response.data.data.map((item) => item.id);
    const successCount = messageIds.length;
    
    // Check for partial failures (only in permissive mode)
    // Type assertion needed due to conditional typing based on batchValidation
    const errors = (response.data as { errors?: Array<{ index: number; message: string }> }).errors || [];
    const failureCount = errors.length;

    console.log(
      `✅ Resend batch sent: ${successCount} succeeded, ${failureCount} failed`
    );

    return {
      success: successCount > 0,
      messageIds,
      successCount,
      failureCount,
      errors: errors.map((err) => ({
        recipient: recipients[err.index] || 'unknown',
        error: err.message,
      })),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to send Resend batch emails:', errorMessage);

    // Fallback: Try sending individually
    console.log('[Resend] Falling back to sequential sends...');
    
    const results = await Promise.allSettled(
      recipients.map((recipient) => sendEmail(recipient, subject, html))
    );

    const messageIds: string[] = [];
    const errors: Array<{ recipient: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        if (result.value.messageId) {
          messageIds.push(result.value.messageId);
        }
      } else {
        errors.push({
          recipient: recipients[index] || 'unknown',
          error:
            result.status === 'fulfilled'
              ? result.value.error || 'Unknown error'
              : result.reason,
        });
      }
    });

    return {
      success: messageIds.length > 0,
      messageIds,
      successCount: messageIds.length,
      failureCount: errors.length,
      errors,
    };
  }
}

/**
 * Schedules an email to be sent at a future date/time using Resend.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content of the email
 * @param sendAt - Date/time when the email should be sent
 * @returns Promise with success status and message ID or error
 *
 * @example
 * ```typescript
 * const scheduledDate = new Date('2025-12-31T23:59:59Z');
 * const result = await scheduleEmail(
 *   'user@example.com',
 *   'Year End Summary',
 *   '<h1>Happy New Year!</h1>',
 *   scheduledDate
 * );
 * ```
 */
export async function scheduleEmail(
  to: string,
  subject: string,
  html: string,
  sendAt: Date
): Promise<SendEmailResult> {
  // Validate inputs
  const toValidation = emailSchema.safeParse(to);
  if (!toValidation.success) {
    const error = 'Invalid recipient email address';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  const subjectValidation = subjectSchema.safeParse(subject);
  if (!subjectValidation.success) {
    const error = 'Invalid subject: must be 1-200 characters';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  const htmlValidation = htmlSchema.safeParse(html);
  if (!htmlValidation.success) {
    const error = 'Invalid HTML content: must not be empty';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  // Validate sendAt is in the future
  if (sendAt <= new Date()) {
    const error = 'Scheduled date must be in the future';
    console.error('[Resend] Validation error:', error);
    return { success: false, error };
  }

  // Development mode fallback
  if (!isConfigured()) {
    console.log('[DEV] Resend scheduled email would be sent:', {
      from: FROM_EMAIL,
      to,
      subject,
      sendAt: sendAt.toISOString(),
    });
    return {
      success: true,
      messageId: `dev-resend-scheduled-${Date.now()}`,
    };
  }

  try {
    const resend = getResendClient();

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      scheduledAt: sendAt.toISOString(),
    });

    // Handle Resend's response format
    if (response.error) {
      const errorMessage = `Resend API error: ${response.error.message}`;
      console.error('[Resend] Schedule failed:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!response.data?.id) {
      const errorMessage = 'Resend API returned no message ID';
      console.error('[Resend] Schedule failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log(
      `✅ Resend email scheduled for ${sendAt.toISOString()} to ${to}, messageId: ${response.data.id}`
    );

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to schedule Resend email to ${to}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
