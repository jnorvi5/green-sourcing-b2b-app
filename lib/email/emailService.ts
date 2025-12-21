/**
 * Unified Email Service
 *
 * Provides a clean interface for sending emails using Resend (preferred) or Zoho (fallback).
 * Implements the requested functionality:
 * - sendEmail(to, template, data)
 * - Templates: RFQ_RECEIVED, QUOTE_SUBMITTED, QUOTE_ACCEPTED, WELCOME_EMAIL, AUDIT_COMPLETE
 * - Logs emails to Supabase if configured.
 */

import { Resend } from 'resend';
import { getZohoClient } from './zoho-client';
import * as Templates from './templates';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Configuration
// =============================================================================

const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const DEFAULT_FROM_EMAIL = 'noreply@greenchainz.com';
const DEFAULT_FROM_NAME = 'GreenChainz';

// =============================================================================
// Supabase Service Role Client (for email logging)
// =============================================================================

function getSupabaseServiceClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    // Silent in dev, warn in prod?
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// =============================================================================
// Types
// =============================================================================

export type EmailTemplateType =
  | 'RFQ_RECEIVED'
  | 'QUOTE_SUBMITTED'
  | 'QUOTE_ACCEPTED'
  | 'WELCOME_EMAIL'
  | 'AUDIT_COMPLETE';

export interface EmailData {
  [key: string]: any;
}

export interface SendEmailOptions {
  to: string | string[];
  subject?: string; // Optional if template provides subject
  template: EmailTemplateType;
  data: EmailData;
  from?: string;
  recipientId?: string; // For logging
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'zoho' | 'none';
  error?: string;
}

// =============================================================================
// Email Service Class
// =============================================================================

export class EmailService {
  private resendClient: Resend | null = null;
  private zohoClient = getZohoClient();

  constructor() {
    if (RESEND_API_KEY) {
      this.resendClient = new Resend(RESEND_API_KEY);
    }
  }

  /**
   * Sends an email using the configured provider.
   */
  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, template, data, from } = options;
    const { html, subject } = this.renderTemplate(template, data, options.subject);
    const recipientEmail = Array.isArray(to) ? to[0] : to; // Log first recipient for now

    // Log Start
    const logId = await this.logEmailStart({
        recipientEmail,
        recipientId: options.recipientId,
        template,
        subject,
        provider: this.resendClient ? 'resend' : 'zoho'
    });

    let result: SendEmailResult = { success: false, provider: 'none' };

    // Try Resend first
    if (this.resendClient) {
      try {
        const resendResult = await this.resendClient.emails.send({
          from: from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
          to: to,
          subject: subject,
          html: html,
        });

        if (resendResult.error) {
            console.error('Resend error:', resendResult.error);
             if (this.zohoClient.isConfigured()) {
                console.warn('Falling back to Zoho...');
             } else {
                 result = { success: false, provider: 'resend', error: resendResult.error.message };
             }
        } else {
            result = { success: true, messageId: resendResult.data?.id, provider: 'resend' };
        }
      } catch (error) {
        console.error('Resend exception:', error);
        // Continue to fallback
      }
    }

    // Fallback to Zoho if Resend failed or not configured, AND we haven't succeeded yet
    if (!result.success && this.zohoClient.isConfigured()) {
      try {
        const recipient = Array.isArray(to) ? to.join(',') : to;
        const zohoResult = await this.zohoClient.sendEmail({
          to: recipient,
          subject: subject,
          html: html,
        });

        result = {
            success: zohoResult.success,
            messageId: zohoResult.messageId,
            provider: 'zoho',
            error: zohoResult.error
        };
      } catch (error) {
        result = {
            success: false,
            provider: 'zoho',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    if (!result.success && result.provider === 'none') {
        console.warn('No email provider configured. Email not sent.');
        result = { success: false, provider: 'none', error: 'No email provider configured' };
    }

    // Log End
    await this.logEmailEnd(logId, result);

    return result;
  }

  /**
   * Renders the HTML content for the given template.
   */
  private renderTemplate(
    type: EmailTemplateType,
    data: EmailData,
    overrideSubject?: string
  ): { html: string; subject: string } {
    let html = '';
    let defaultSubject = 'Notification';

    switch (type) {
      case 'RFQ_RECEIVED':
        html = Templates.generateRfqNotificationEmail({
            supplierName: data.supplierName,
            rfqNumber: data.rfqNumber,
            productName: data.productName,
            quantity: data.quantity,
            unit: data.unit,
            buyerCompany: data.buyerCompany,
            projectName: data.projectName,
            deliveryLocation: data.deliveryLocation,
            deliveryDate: data.deliveryDate,
            expiresAt: data.expiresAt,
            viewUrl: data.viewUrl,
            rfqId: data.rfqId || ''
        });
        defaultSubject = `New RFQ: ${data.productName}`;
        break;

      case 'QUOTE_SUBMITTED':
        html = Templates.newQuoteEmail(
            data.architectName,
            data.rfqName,
            data.supplierName,
            data.quoteUrl,
            data.quotePreview
        );
        defaultSubject = `Quote Received: ${data.rfqName}`;
        break;

      case 'QUOTE_ACCEPTED':
        html = Templates.quoteAcceptedEmail(
            data.supplierName,
            data.rfqName,
            data.architectContact
        );
        defaultSubject = `Quote Accepted: ${data.rfqName}`;
        break;

      case 'WELCOME_EMAIL':
        if (data.role === 'buyer' || data.role === 'architect') {
            html = Templates.generateArchitectWelcomeEmail({
                name: data.name,
                createRfqUrl: data.createRfqUrl || 'https://greenchainz.com/rfq/new'
            });
        } else {
            html = Templates.generateSupplierWelcomeEmail({
                name: data.name,
                dashboardUrl: data.dashboardUrl || 'https://greenchainz.com/dashboard/supplier'
            });
        }
        defaultSubject = `Welcome to GreenChainz, ${data.name}!`;
        break;

      case 'AUDIT_COMPLETE':
        html = Templates.generateAuditCompleteEmail({
            userName: data.userName,
            projectName: data.projectName,
            reportUrl: data.reportUrl,
            totalCarbon: data.totalCarbon,
            score: data.score
        });
        defaultSubject = `Audit Complete: ${data.projectName}`;
        break;

      default:
        throw new Error(`Unknown template type: ${type}`);
    }

    return {
      html,
      subject: overrideSubject || defaultSubject,
    };
  }

  // ===========================================================================
  // Logging
  // ===========================================================================

  private async logEmailStart(params: {
    recipientEmail: string;
    recipientId?: string;
    template: string;
    subject: string;
    provider: string;
  }): Promise<string | null> {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase.from('email_logs').insert({
            recipient_email: params.recipientEmail,
            recipient_id: params.recipientId,
            email_type: params.template, // Mapping template to email_type for now
            subject: params.subject,
            provider: params.provider,
            status: 'pending',
            created_at: new Date().toISOString()
        }).select('id').single();

        if (error) {
            console.error('Failed to log email start:', error);
            return null;
        }
        return data.id;
    } catch (e) {
        console.error('Exception logging email start:', e);
        return null;
    }
  }

  private async logEmailEnd(logId: string | null, result: SendEmailResult): Promise<void> {
      if (!logId) return;
      const supabase = getSupabaseServiceClient();
      if (!supabase) return;

      try {
          await supabase.from('email_logs').update({
              status: result.success ? 'sent' : 'failed',
              provider_message_id: result.messageId,
              error_message: result.error,
              sent_at: result.success ? new Date().toISOString() : null,
              failed_at: !result.success ? new Date().toISOString() : null
          }).eq('id', logId);
      } catch (e) {
          console.error('Exception logging email end:', e);
      }
  }
}

// =============================================================================
// Singleton
// =============================================================================

let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

export async function sendEmail(
    to: string | string[],
    template: EmailTemplateType,
    data: EmailData,
    options: Partial<SendEmailOptions> = {}
): Promise<SendEmailResult> {
    return getEmailService().sendEmail({
        to,
        template,
        data,
        ...options
    });
}
