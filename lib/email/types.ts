/**
 * Email System Type Definitions
 *
 * Zod schemas and TypeScript types for the unified email strategy.
 * Separates transactional emails (Zoho Mail) from marketing emails (MailerLite).
 */

import { z } from 'zod';

// =============================================================================
// Email Category & Type Enums
// =============================================================================

export const EmailCategorySchema = z.enum(['transactional', 'marketing']);
export type EmailCategory = z.infer<typeof EmailCategorySchema>;

export const EmailTypeSchema = z.enum([
  // Transactional (Zoho Mail)
  'rfq_notification_supplier',
  'rfq_confirmation_buyer',
  'password_reset',
  'account_verification',
  'supplier_approval',
  'supplier_rejection',
  'supplier_claim',
  'critical_update',
  // Marketing (MailerLite)
  'newsletter_weekly',
  'newsletter_monthly',
  'onboarding_sequence',
  'feature_announcement',
  'educational_content',
]);
export type EmailType = z.infer<typeof EmailTypeSchema>;

export const EmailStatusSchema = z.enum([
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'unsubscribed',
]);
export type EmailStatus = z.infer<typeof EmailStatusSchema>;

export const EmailProviderSchema = z.enum(['zoho', 'mailerlite']);
export type EmailProvider = z.infer<typeof EmailProviderSchema>;

// =============================================================================
// Email Routing Configuration
// =============================================================================

/**
 * Maps email types to their corresponding provider.
 * Transactional emails go through Zoho Mail.
 * Marketing emails go through MailerLite.
 */
export const EMAIL_ROUTING: Record<EmailType, { provider: EmailProvider; category: EmailCategory }> = {
  // Transactional emails (Zoho Mail)
  rfq_notification_supplier: { provider: 'zoho', category: 'transactional' },
  rfq_confirmation_buyer: { provider: 'zoho', category: 'transactional' },
  password_reset: { provider: 'zoho', category: 'transactional' },
  account_verification: { provider: 'zoho', category: 'transactional' },
  supplier_approval: { provider: 'zoho', category: 'transactional' },
  supplier_rejection: { provider: 'zoho', category: 'transactional' },
  supplier_claim: { provider: 'zoho', category: 'transactional' },
  critical_update: { provider: 'zoho', category: 'transactional' },
  // Marketing emails (MailerLite)
  newsletter_weekly: { provider: 'mailerlite', category: 'marketing' },
  newsletter_monthly: { provider: 'mailerlite', category: 'marketing' },
  onboarding_sequence: { provider: 'mailerlite', category: 'marketing' },
  feature_announcement: { provider: 'mailerlite', category: 'marketing' },
  educational_content: { provider: 'mailerlite', category: 'marketing' },
};

// =============================================================================
// Zod Schemas for Email Data
// =============================================================================

export const EmailRecipientSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().optional(),
});
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;

export const SendEmailRequestSchema = z.object({
  recipient: EmailRecipientSchema,
  emailType: EmailTypeSchema,
  subject: z.string().min(1).max(200),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

export const EmailLogSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid().nullable(),
  recipientEmail: z.string().email(),
  recipientName: z.string().nullable(),
  emailType: EmailTypeSchema,
  emailCategory: EmailCategorySchema,
  provider: EmailProviderSchema,
  subject: z.string(),
  templateId: z.string().nullable(),
  templateData: z.record(z.unknown()),
  status: EmailStatusSchema,
  providerMessageId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sentAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
  clickedAt: z.string().datetime().nullable(),
  bouncedAt: z.string().datetime().nullable(),
  failedAt: z.string().datetime().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EmailLog = z.infer<typeof EmailLogSchema>;

// =============================================================================
// Zoho Mail Types
// =============================================================================

export const ZohoOAuthTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string().optional(),
});
export type ZohoOAuthToken = z.infer<typeof ZohoOAuthTokenSchema>;

export const ZohoSendEmailResponseSchema = z.object({
  status: z.object({
    code: z.number(),
    description: z.string(),
  }),
  data: z
    .object({
      messageId: z.string().optional(),
    })
    .optional(),
});
export type ZohoSendEmailResponse = z.infer<typeof ZohoSendEmailResponseSchema>;

export const ZohoEmailPayloadSchema = z.object({
  fromAddress: z.string().email(),
  toAddress: z.string(),
  subject: z.string(),
  content: z.string(),
  mailFormat: z.enum(['html', 'plaintext']).optional(),
});
export type ZohoEmailPayload = z.infer<typeof ZohoEmailPayloadSchema>;

// =============================================================================
// MailerLite Types
// =============================================================================

export const MailerLiteSubscriberSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  fields: z
    .object({
      name: z.string().optional(),
      last_name: z.string().optional(),
      company: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
      z_i_p: z.string().optional(),
      state: z.string().optional(),
    })
    .passthrough()
    .optional(),
  groups: z.array(z.string()).optional(),
  status: z.enum(['active', 'unsubscribed', 'unconfirmed', 'bounced', 'junk']).optional(),
  subscribed_at: z.string().datetime().optional(),
  unsubscribed_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
export type MailerLiteSubscriber = z.infer<typeof MailerLiteSubscriberSchema>;

export const MailerLiteGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  active_count: z.number(),
  sent_count: z.number(),
  opens_count: z.number(),
  open_rate: z.object({
    float: z.number(),
    string: z.string(),
  }),
  clicks_count: z.number(),
  click_rate: z.object({
    float: z.number(),
    string: z.string(),
  }),
  unsubscribed_count: z.number(),
  unconfirmed_count: z.number(),
  bounced_count: z.number(),
  junk_count: z.number(),
  created_at: z.string().datetime(),
});
export type MailerLiteGroup = z.infer<typeof MailerLiteGroupSchema>;

export const MailerLiteApiResponseSchema = z.object({
  data: z.unknown(),
  links: z
    .object({
      first: z.string().nullable(),
      last: z.string().nullable(),
      prev: z.string().nullable(),
      next: z.string().nullable(),
    })
    .optional(),
  meta: z
    .object({
      current_page: z.number(),
      from: z.number().nullable(),
      last_page: z.number(),
      path: z.string(),
      per_page: z.number(),
      to: z.number().nullable(),
      total: z.number(),
    })
    .optional(),
});
export type MailerLiteApiResponse = z.infer<typeof MailerLiteApiResponseSchema>;

export const MailerLiteCampaignSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  name: z.string(),
  type: z.enum(['regular', 'ab', 'resend', 'rss']),
  status: z.enum(['draft', 'outbox', 'sending', 'sent']),
  emails: z.array(
    z.object({
      id: z.string(),
      account_id: z.string(),
      campaign_id: z.string(),
      from: z.string(),
      from_name: z.string(),
      subject: z.string(),
      content: z.string().optional(),
      plain_text: z.string().optional(),
      screenshot_url: z.string().nullable(),
      preview_url: z.string().nullable(),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
    })
  ),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  scheduled_for: z.string().datetime().nullable(),
  sent_at: z.string().datetime().nullable(),
});
export type MailerLiteCampaign = z.infer<typeof MailerLiteCampaignSchema>;

// =============================================================================
// MailerLite Group Constants
// =============================================================================

/**
 * Pre-defined MailerLite group IDs for user segmentation.
 * These should be created in MailerLite dashboard first.
 */
export const MAILERLITE_GROUPS = {
  // Architect segments
  ARCHITECTS_ACTIVE: 'architects_active',
  ARCHITECTS_INACTIVE: 'architects_inactive',
  ARCHITECTS_TRIAL: 'architects_trial',
  // Supplier segments
  SUPPLIERS_VERIFIED: 'suppliers_verified',
  SUPPLIERS_PENDING: 'suppliers_pending',
  SUPPLIERS_REJECTED: 'suppliers_rejected',
  // Admin segment
  ADMINS: 'admins_internal',
  // Newsletter segments
  NEWSLETTER_WEEKLY: 'newsletter_weekly',
  NEWSLETTER_MONTHLY: 'newsletter_monthly',
} as const;

export type MailerLiteGroupKey = keyof typeof MAILERLITE_GROUPS;

// =============================================================================
// Email Preferences
// =============================================================================

export const EmailPreferencesSchema = z.object({
  marketing_emails: z.boolean().default(true),
  newsletter_weekly: z.boolean().default(true),
  newsletter_monthly: z.boolean().default(true),
  product_updates: z.boolean().default(true),
  rfq_notifications: z.boolean().default(true),
  quote_notifications: z.boolean().default(true),
});
export type EmailPreferences = z.infer<typeof EmailPreferencesSchema>;

// =============================================================================
// Sync Log Types
// =============================================================================

export const SyncLogSchema = z.object({
  id: z.string().uuid(),
  syncType: z.enum(['full', 'incremental', 'user_signup', 'user_update']),
  usersProcessed: z.number(),
  usersAdded: z.number(),
  usersUpdated: z.number(),
  usersRemoved: z.number(),
  errorsCount: z.number(),
  architectsActive: z.number(),
  architectsInactive: z.number(),
  architectsTrial: z.number(),
  suppliersVerified: z.number(),
  suppliersPending: z.number(),
  suppliersRejected: z.number(),
  admins: z.number(),
  status: z.enum(['running', 'completed', 'failed']),
  errorDetails: z.array(z.record(z.unknown())),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationMs: z.number().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type SyncLog = z.infer<typeof SyncLogSchema>;

// =============================================================================
// RFQ Email Data Types
// =============================================================================

export const RfqNotificationDataSchema = z.object({
  supplierName: z.string(),
  rfqId: z.string(),
  rfqNumber: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  buyerCompany: z.string(),
  projectName: z.string(),
  deliveryLocation: z.string(),
  deliveryDate: z.string(),
  expiresAt: z.string(),
  viewUrl: z.string().url(),
});
export type RfqNotificationData = z.infer<typeof RfqNotificationDataSchema>;

export const RfqConfirmationDataSchema = z.object({
  buyerName: z.string(),
  rfqId: z.string(),
  rfqNumber: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  supplierName: z.string(),
  expectedResponseDate: z.string(),
  viewUrl: z.string().url(),
});
export type RfqConfirmationData = z.infer<typeof RfqConfirmationDataSchema>;

export const SupplierApprovalDataSchema = z.object({
  supplierName: z.string(),
  companyName: z.string(),
  dashboardUrl: z.string().url(),
  nextSteps: z.array(z.string()).optional(),
});
export type SupplierApprovalData = z.infer<typeof SupplierApprovalDataSchema>;

export const SupplierRejectionDataSchema = z.object({
  supplierName: z.string(),
  companyName: z.string(),
  reason: z.string(),
  canReapply: z.boolean(),
  reapplyUrl: z.string().url().optional(),
  contactEmail: z.string().email(),
});
export type SupplierRejectionData = z.infer<typeof SupplierRejectionDataSchema>;

export const SupplierClaimDataSchema = z.object({
  companyName: z.string(),
  claimUrl: z.string().url(),
});
export type SupplierClaimData = z.infer<typeof SupplierClaimDataSchema>;

// =============================================================================
// Email Service Result Types
// =============================================================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: EmailProvider;
  emailLogId?: string;
  error?: string;
}

export interface SubscriberSyncResult {
  success: boolean;
  subscriberId?: string;
  action: 'created' | 'updated' | 'unchanged' | 'failed';
  error?: string;
}
