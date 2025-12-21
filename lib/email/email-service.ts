/**
 * Email Service
 *
 * Central email service that routes emails to the correct provider
 * (Zoho for transactional, MailerLite for marketing) and logs all emails.
 */

import { createClient } from '@supabase/supabase-js';
import { getZohoClient } from './zoho-client';
import { getMailerLiteClient } from './mailerlite-client';
import {
  EMAIL_ROUTING,
  MAILERLITE_GROUPS,
  type EmailType,
  type EmailProvider,
  type EmailCategory,
  type SendEmailResult,
  type RfqNotificationData,
  type RfqConfirmationData,
  type SupplierApprovalData,
  type SupplierRejectionData,
} from './types';
import {
  generateRfqNotificationEmail,
  generateRfqConfirmationEmail,
  generateSupplierApprovalEmail,
  generateSupplierRejectionEmail,
  generateAccountVerificationEmail,
  generatePasswordResetEmail,
} from './templates/general';

// =============================================================================
// Supabase Service Role Client (for email logging)
// =============================================================================

function getSupabaseServiceClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase service role not configured, email logging disabled');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// =============================================================================
// Email Service Class
// =============================================================================

export class EmailService {
  private zohoClient = getZohoClient();
  private mailerLiteClient = getMailerLiteClient();

  /**
   * Sends an email using the appropriate provider based on email type.
   */
  public async sendEmail(options: {
    recipientId?: string;
    recipientEmail: string;
    recipientName?: string;
    emailType: EmailType;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: string;
    templateData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<SendEmailResult> {
    const routing = EMAIL_ROUTING[options.emailType];
    const { provider, category } = routing;

    // Log the email before sending
    const emailLogId = await this.logEmail({
      recipientId: options.recipientId,
      recipientEmail: options.recipientEmail,
      recipientName: options.recipientName,
      emailType: options.emailType,
      emailCategory: category,
      provider,
      subject: options.subject,
      templateId: options.templateId,
      templateData: options.templateData ?? {},
      metadata: options.metadata ?? {},
      status: 'pending',
    });

    let result: { success: boolean; messageId?: string; error?: string };

    try {
      if (provider === 'zoho') {
        result = await this.zohoClient.sendEmail({
          to: options.recipientEmail,
          subject: options.subject,
          html: options.htmlContent,
          text: options.textContent,
        });
      } else {
        // MailerLite - for marketing emails, we typically add to campaign or trigger automation
        // For direct transactional-style marketing, we can use their transactional API
        result = await this.sendViaMailerLite({
          to: options.recipientEmail,
          subject: options.subject,
          html: options.htmlContent,
        });
      }

      // Update email log with result
      if (emailLogId) {
        await this.updateEmailLog(emailLogId, {
          status: result.success ? 'sent' : 'failed',
          providerMessageId: result.messageId,
          errorMessage: result.error,
          sentAt: result.success ? new Date().toISOString() : undefined,
          failedAt: !result.success ? new Date().toISOString() : undefined,
        });
      }

      return {
        success: result.success,
        messageId: result.messageId,
        provider,
        emailLogId: emailLogId ?? undefined,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update email log with error
      if (emailLogId) {
        await this.updateEmailLog(emailLogId, {
          status: 'failed',
          errorMessage,
          failedAt: new Date().toISOString(),
        });
      }

      return {
        success: false,
        provider,
        emailLogId: emailLogId ?? undefined,
        error: errorMessage,
      };
    }
  }

  /**
   * Sends email via MailerLite (for marketing-style emails).
   */
  private async sendViaMailerLite(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // For direct email sending via MailerLite, we create a single-recipient campaign
    // In practice, marketing emails would use campaigns or automations
    const result = await this.mailerLiteClient.createCampaign({
      name: `Direct: ${options.subject.substring(0, 50)}`,
      subject: options.subject,
      content: options.html,
      groupIds: [], // Direct send
    });

    return {
      success: result.success,
      messageId: result.campaignId,
      error: result.error,
    };
  }

  /**
   * Logs an email to the database.
   */
  private async logEmail(data: {
    recipientId?: string;
    recipientEmail: string;
    recipientName?: string;
    emailType: EmailType;
    emailCategory: EmailCategory;
    provider: EmailProvider;
    subject: string;
    templateId?: string;
    templateData: Record<string, unknown>;
    metadata: Record<string, unknown>;
    status: string;
  }): Promise<string | null> {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return null;

    try {
      const { data: emailLog, error } = await supabase
        .from('email_logs')
        .insert({
          recipient_id: data.recipientId,
          recipient_email: data.recipientEmail,
          recipient_name: data.recipientName,
          email_type: data.emailType,
          email_category: data.emailCategory,
          provider: data.provider,
          subject: data.subject,
          template_id: data.templateId,
          template_data: data.templateData,
          metadata: data.metadata,
          status: data.status,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log email:', error);
        return null;
      }

      return emailLog.id;
    } catch (error) {
      console.error('Failed to log email:', error);
      return null;
    }
  }

  /**
   * Updates an email log entry.
   */
  private async updateEmailLog(
    emailLogId: string,
    updates: {
      status?: string;
      providerMessageId?: string;
      errorMessage?: string;
      sentAt?: string;
      deliveredAt?: string;
      openedAt?: string;
      clickedAt?: string;
      bouncedAt?: string;
      failedAt?: string;
    }
  ): Promise<void> {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return;

    try {
      await supabase
        .from('email_logs')
        .update({
          status: updates.status,
          provider_message_id: updates.providerMessageId,
          error_message: updates.errorMessage,
          sent_at: updates.sentAt,
          delivered_at: updates.deliveredAt,
          opened_at: updates.openedAt,
          clicked_at: updates.clickedAt,
          bounced_at: updates.bouncedAt,
          failed_at: updates.failedAt,
        })
        .eq('id', emailLogId);
    } catch (error) {
      console.error('Failed to update email log:', error);
    }
  }

  // ===========================================================================
  // Convenience Methods for Specific Email Types
  // ===========================================================================

  /**
   * Sends an RFQ notification email to a supplier.
   */
  public async sendRfqNotificationToSupplier(
    supplierEmail: string,
    supplierId: string,
    data: RfqNotificationData
  ): Promise<SendEmailResult> {
    const html = generateRfqNotificationEmail(data);

    return this.sendEmail({
      recipientId: supplierId,
      recipientEmail: supplierEmail,
      recipientName: data.supplierName,
      emailType: 'rfq_notification_supplier',
      subject: `New RFQ Request: ${data.productName} - ${data.rfqNumber}`,
      htmlContent: html,
      templateData: data,
      metadata: { rfqId: data.rfqId },
    });
  }

  /**
   * Sends an RFQ confirmation email to the buyer/architect.
   */
  public async sendRfqConfirmationToArchitect(
    buyerEmail: string,
    buyerId: string,
    data: RfqConfirmationData
  ): Promise<SendEmailResult> {
    const html = generateRfqConfirmationEmail(data);

    return this.sendEmail({
      recipientId: buyerId,
      recipientEmail: buyerEmail,
      recipientName: data.buyerName,
      emailType: 'rfq_confirmation_buyer',
      subject: `RFQ Submitted: ${data.productName} - ${data.rfqNumber}`,
      htmlContent: html,
      templateData: data,
      metadata: { rfqId: data.rfqId },
    });
  }

  /**
   * Sends a supplier approval notification.
   */
  public async sendSupplierApprovalNotice(
    supplierEmail: string,
    supplierId: string,
    data: SupplierApprovalData
  ): Promise<SendEmailResult> {
    const html = generateSupplierApprovalEmail(data);

    // Also add to verified suppliers group in MailerLite
    await this.mailerLiteClient.upsertSubscriber({
      email: supplierEmail,
      fields: {
        name: data.supplierName,
        company: data.companyName,
      },
      groups: [MAILERLITE_GROUPS.SUPPLIERS_VERIFIED],
    });

    return this.sendEmail({
      recipientId: supplierId,
      recipientEmail: supplierEmail,
      recipientName: data.supplierName,
      emailType: 'supplier_approval',
      subject: `Congratulations! Your GreenChainz Supplier Account is Approved`,
      htmlContent: html,
      templateData: data,
    });
  }

  /**
   * Sends a supplier rejection notification.
   */
  public async sendSupplierRejectionNotice(
    supplierEmail: string,
    supplierId: string,
    data: SupplierRejectionData
  ): Promise<SendEmailResult> {
    const html = generateSupplierRejectionEmail(data);

    return this.sendEmail({
      recipientId: supplierId,
      recipientEmail: supplierEmail,
      recipientName: data.supplierName,
      emailType: 'supplier_rejection',
      subject: `GreenChainz Application Status Update`,
      htmlContent: html,
      templateData: data,
    });
  }

  /**
   * Sends an account verification email.
   */
  public async sendAccountVerificationEmail(
    email: string,
    userId: string,
    data: { userName: string; verificationUrl: string }
  ): Promise<SendEmailResult> {
    const html = generateAccountVerificationEmail(data);

    return this.sendEmail({
      recipientId: userId,
      recipientEmail: email,
      recipientName: data.userName,
      emailType: 'account_verification',
      subject: `Verify Your GreenChainz Account`,
      htmlContent: html,
      templateData: data,
    });
  }

  /**
   * Sends a password reset email.
   */
  public async sendPasswordResetEmail(
    email: string,
    userId: string,
    data: { userName: string; resetUrl: string; expiresIn: string }
  ): Promise<SendEmailResult> {
    const html = generatePasswordResetEmail(data);

    return this.sendEmail({
      recipientId: userId,
      recipientEmail: email,
      recipientName: data.userName,
      emailType: 'password_reset',
      subject: `Reset Your GreenChainz Password`,
      htmlContent: html,
      templateData: data,
    });
  }

  /**
   * Triggers the onboarding email sequence for a new user.
   */
  public async triggerOnboardingSequence(
    email: string,
    userType: 'buyer' | 'supplier',
    userData: {
      name: string;
      company?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // First, ensure the user is a subscriber
    await this.mailerLiteClient.upsertSubscriber({
      email,
      fields: {
        name: userData.name,
        company: userData.company,
      },
      groups:
        userType === 'buyer'
          ? [MAILERLITE_GROUPS.ARCHITECTS_TRIAL]
          : [MAILERLITE_GROUPS.SUPPLIERS_PENDING],
    });

    // Then trigger the onboarding automation
    return this.mailerLiteClient.triggerOnboardingSequence(email, userType);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let emailServiceInstance: EmailService | null = null;

/**
 * Gets the singleton EmailService instance.
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

// =============================================================================
// Convenience Function Exports
// =============================================================================

export async function sendRfqNotificationToSupplier(
  supplierEmail: string,
  supplierId: string,
  data: RfqNotificationData
): Promise<SendEmailResult> {
  return getEmailService().sendRfqNotificationToSupplier(supplierEmail, supplierId, data);
}

export async function sendRfqConfirmationToArchitect(
  buyerEmail: string,
  buyerId: string,
  data: RfqConfirmationData
): Promise<SendEmailResult> {
  return getEmailService().sendRfqConfirmationToArchitect(buyerEmail, buyerId, data);
}

export async function sendSupplierApprovalNotice(
  supplierEmail: string,
  supplierId: string,
  data: SupplierApprovalData
): Promise<SendEmailResult> {
  return getEmailService().sendSupplierApprovalNotice(supplierEmail, supplierId, data);
}

export async function triggerOnboardingSequence(
  email: string,
  userType: 'buyer' | 'supplier',
  userData: { name: string; company?: string }
): Promise<{ success: boolean; error?: string }> {
  return getEmailService().triggerOnboardingSequence(email, userType, userData);
}

export default EmailService;
