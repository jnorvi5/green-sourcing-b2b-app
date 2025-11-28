/**
 * Outreach System Type Definitions
 * 
 * Comprehensive TypeScript types for the GreenChainz Outreach Agent
 */

// =============================================================================
// Enums
// =============================================================================

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  RESPONDED = 'responded',
  MEETING_SCHEDULED = 'meeting_scheduled',
  CONVERTED = 'converted',
  COLD = 'cold',
}

export enum LeadType {
  SUPPLIER = 'supplier',
  DATA_PROVIDER = 'data_provider',
  ARCHITECT = 'architect',
  PARTNER = 'partner',
}

export enum EmailType {
  INITIAL = 'initial',
  FOLLOW_UP_1 = 'follow_up_1',
  FOLLOW_UP_2 = 'follow_up_2',
  FOLLOW_UP_3 = 'follow_up_3',
}

export enum EmailStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SENT = 'sent',
  OPENED = 'opened',
  REPLIED = 'replied',
  BOUNCED = 'bounced',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum EmailTone {
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
  CASUAL = 'casual',
}

// =============================================================================
// Interfaces
// =============================================================================

export interface LeadContext {
  companyDescription?: string;
  certifications?: string[];
  recentNews?: string;
  customHook?: string; // Why we're reaching out specifically to them
}

export interface IEmail {
  subject: string;
  body: string;
  htmlBody?: string;
  generatedAt: Date;
  sentAt?: Date;
  status: EmailStatus;
  type: EmailType;
  messageId?: string; // From SMTP response
  openedAt?: Date;
  repliedAt?: Date;
}

export interface ILead {
  _id?: string;
  companyName: string;
  contactName: string;
  email: string;
  role: string;
  phone?: string;
  website?: string;
  leadType: LeadType;
  status: LeadStatus;
  source: string; // LinkedIn, referral, website, etc.
  priority: LeadPriority;
  tags: string[];
  notes: string;
  
  // Email tracking
  emails: IEmail[];
  
  // Follow-up automation
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  followUpCount: number;
  autoFollowUpEnabled: boolean;
  
  // Personalization context (for AI email generation)
  context: LeadContext;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

// Generate Email
export interface GenerateEmailRequest {
  leadId: string;
  emailType: EmailType;
  tone?: EmailTone;
}

export interface GenerateEmailResponse {
  success: boolean;
  email?: {
    subject: string;
    body: string;
    htmlBody: string;
  };
  error?: string;
}

// Send Email
export interface SendEmailRequest {
  leadId: string;
  emailIndex: number;
  sendNow?: boolean;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// List Leads
export interface ListLeadsQuery {
  status?: LeadStatus;
  leadType?: LeadType;
  priority?: LeadPriority;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListLeadsResponse {
  success: boolean;
  leads: ILead[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

// Create Lead
export interface CreateLeadRequest {
  companyName: string;
  contactName: string;
  email: string;
  role: string;
  phone?: string;
  website?: string;
  leadType: LeadType;
  source: string;
  priority?: LeadPriority;
  tags?: string[];
  notes?: string;
  context?: LeadContext;
  autoFollowUpEnabled?: boolean;
}

export interface CreateLeadResponse {
  success: boolean;
  lead?: ILead;
  error?: string;
}

// Update Lead
export interface UpdateLeadRequest {
  companyName?: string;
  contactName?: string;
  email?: string;
  role?: string;
  phone?: string;
  website?: string;
  leadType?: LeadType;
  status?: LeadStatus;
  source?: string;
  priority?: LeadPriority;
  tags?: string[];
  notes?: string;
  context?: LeadContext;
  autoFollowUpEnabled?: boolean;
  nextFollowUpAt?: Date | string;
}

export interface UpdateLeadResponse {
  success: boolean;
  lead?: ILead;
  error?: string;
}

// Approve Email
export interface ApproveEmailRequest {
  emailIndex: number;
  editedSubject?: string;
  editedBody?: string;
  editedHtmlBody?: string;
}

export interface ApproveEmailResponse {
  success: boolean;
  lead?: ILead;
  error?: string;
}

// Follow-ups
export interface FollowUpLead {
  lead: ILead;
  nextEmailType: EmailType;
  daysSinceLastContact: number;
}

export interface GetFollowUpsResponse {
  success: boolean;
  followUps: FollowUpLead[];
  total: number;
  error?: string;
}

export interface ProcessFollowUpsRequest {
  autoSend?: boolean;
  limit?: number;
}

export interface ProcessFollowUpsResponse {
  success: boolean;
  processed: number;
  sent: number;
  drafted: number;
  errors: string[];
}

// =============================================================================
// Azure AI Types
// =============================================================================

export interface EmailGenerationRequest {
  lead: {
    companyName: string;
    contactName: string;
    role: string;
    leadType: string;
    context: LeadContext;
  };
  emailType: EmailType;
  tone?: EmailTone;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  htmlBody: string;
}

// =============================================================================
// Zoho SMTP Types
// =============================================================================

export interface SendSmtpEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendSmtpEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Stats Types
// =============================================================================

export interface OutreachStats {
  totalLeads: number;
  byStatus: Record<LeadStatus, number>;
  byType: Record<LeadType, number>;
  emailsSentThisWeek: number;
  emailsSentThisMonth: number;
  responseRate: number;
  conversionRate: number;
}
