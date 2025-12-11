/**
 * AWS SES Email Client for GreenChainz
 * 
 * Provides utilities for sending transactional emails using AWS SES.
 * Supports both raw email sending and templated emails.
 */

import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  SendBulkTemplatedEmailCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
} from '@aws-sdk/client-ses';
import { z } from 'zod';

// Environment configuration
const AWS_REGION = process.env['AWS_SES_REGION'] ?? process.env['AWS_REGION'] ?? 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'];
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'];
const FROM_EMAIL = process.env['AWS_SES_FROM_EMAIL'] ?? 'noreply@greenchainz.com';
const CONFIGURATION_SET = process.env['AWS_SES_CONFIGURATION_SET'] ?? 'gc-transactional';

// Initialize SES client
const sesClient = new SESClient({
  region: AWS_REGION,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  }),
});

// Email validation schema
const emailSchema = z.string().email();

// Template names (match SES templates)
export const EMAIL_TEMPLATES = {
  RFQ_NOTIFICATION: 'gc-rfq-notification',
  SUPPLIER_VERIFICATION: 'gc-supplier-verification',
  GREEN_AUDIT_REPORT: 'gc-green-audit-report',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendTemplatedEmailOptions<T extends Record<string, unknown>> {
  to: string | string[];
  template: EmailTemplate;
  templateData: T;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface BulkEmailRecipient<T extends Record<string, unknown>> {
  to: string;
  templateData: T;
}

interface SendBulkTemplatedEmailOptions<T extends Record<string, unknown>> {
  recipients: BulkEmailRecipient<T>[];
  template: EmailTemplate;
  defaultTemplateData?: Partial<T>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendQuotaInfo {
  max24HourSend: number;
  maxSendRate: number;
  sentLast24Hours: number;
  remainingQuota: number;
}

/**
 * Send a raw email
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    // Validate email addresses
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    toAddresses.forEach(email => emailSchema.parse(email));

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: options.cc,
        BccAddresses: options.bcc,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text && {
            Text: {
              Data: options.text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      ConfigurationSetName: CONFIGURATION_SET,
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to send email:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail<T extends Record<string, unknown>>(
  options: SendTemplatedEmailOptions<T>
): Promise<EmailResult> {
  try {
    // Validate email addresses
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    toAddresses.forEach(email => emailSchema.parse(email));

    const command = new SendTemplatedEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: options.cc,
        BccAddresses: options.bcc,
      },
      Template: options.template,
      TemplateData: JSON.stringify(options.templateData),
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      ConfigurationSetName: CONFIGURATION_SET,
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to send templated email:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send bulk templated emails
 */
export async function sendBulkTemplatedEmail<T extends Record<string, unknown>>(
  options: SendBulkTemplatedEmailOptions<T>
): Promise<{
  success: boolean;
  results: Array<{ recipient: string; success: boolean; messageId?: string; error?: string }>;
}> {
  try {
    // Validate all email addresses
    options.recipients.forEach(r => emailSchema.parse(r.to));

    const command = new SendBulkTemplatedEmailCommand({
      Source: FROM_EMAIL,
      Template: options.template,
      DefaultTemplateData: options.defaultTemplateData 
        ? JSON.stringify(options.defaultTemplateData) 
        : '{}',
      Destinations: options.recipients.map(recipient => ({
        Destination: {
          ToAddresses: [recipient.to],
        },
        ReplacementTemplateData: JSON.stringify(recipient.templateData),
      })),
      ConfigurationSetName: CONFIGURATION_SET,
    });

    const response = await sesClient.send(command);

    const results = response.Status?.map((status, index) => ({
      recipient: options.recipients[index]?.to ?? '',
      success: status.Status === 'Success',
      messageId: status.MessageId,
      error: status.Error,
    })) ?? [];

    return {
      success: results.every(r => r.success),
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to send bulk templated email:', errorMessage);
    
    return {
      success: false,
      results: options.recipients.map(r => ({
        recipient: r.to,
        success: false,
        error: errorMessage,
      })),
    };
  }
}

/**
 * Get SES send quota information
 */
export async function getSendQuota(): Promise<SendQuotaInfo> {
  const command = new GetSendQuotaCommand({});
  const response = await sesClient.send(command);

  return {
    max24HourSend: response.Max24HourSend ?? 0,
    maxSendRate: response.MaxSendRate ?? 0,
    sentLast24Hours: response.SentLast24Hours ?? 0,
    remainingQuota: (response.Max24HourSend ?? 0) - (response.SentLast24Hours ?? 0),
  };
}

/**
 * Get SES send statistics
 */
export async function getSendStatistics(): Promise<{
  deliveryAttempts: number;
  bounces: number;
  complaints: number;
  rejects: number;
}> {
  const command = new GetSendStatisticsCommand({});
  const response = await sesClient.send(command);

  // Aggregate statistics from all data points
  const stats = {
    deliveryAttempts: 0,
    bounces: 0,
    complaints: 0,
    rejects: 0,
  };

  response.SendDataPoints?.forEach(point => {
    stats.deliveryAttempts += point.DeliveryAttempts ?? 0;
    stats.bounces += point.Bounces ?? 0;
    stats.complaints += point.Complaints ?? 0;
    stats.rejects += point.Rejects ?? 0;
  });

  return stats;
}

// ============================================
// Convenience functions for common email types
// ============================================

interface RFQNotificationData extends Record<string, unknown> {
  supplierName: string;
  productName: string;
  quantity: string;
  deadline: string;
  buyerMessage: string;
}

/**
 * Send RFQ notification to supplier
 */
export async function sendRFQNotification(
  supplierEmail: string,
  data: RFQNotificationData
): Promise<EmailResult> {
  return sendTemplatedEmail({
    to: supplierEmail,
    template: EMAIL_TEMPLATES.RFQ_NOTIFICATION,
    templateData: data,
  });
}

interface SupplierVerificationData extends Record<string, unknown> {
  supplierName: string;
  companyName: string;
  certifications: string;
}

/**
 * Send supplier verification confirmation
 */
export async function sendSupplierVerificationEmail(
  supplierEmail: string,
  data: SupplierVerificationData
): Promise<EmailResult> {
  return sendTemplatedEmail({
    to: supplierEmail,
    template: EMAIL_TEMPLATES.SUPPLIER_VERIFICATION,
    templateData: data,
  });
}

interface GreenAuditReportData extends Record<string, unknown> {
  userName: string;
  projectName: string;
  totalCarbon: string;
  materialsCount: string;
  sustainabilityScore: string;
  recommendations: string;
  auditId: string;
}

/**
 * Send Green Audit report notification
 */
export async function sendGreenAuditReport(
  userEmail: string,
  data: GreenAuditReportData
): Promise<EmailResult> {
  return sendTemplatedEmail({
    to: userEmail,
    template: EMAIL_TEMPLATES.GREEN_AUDIT_REPORT,
    templateData: data,
  });
}

export { sesClient };
