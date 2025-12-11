/**
 * Lead Model - MongoDB Schema for Outreach Management
 * 
 * Tracks leads, email communications, and follow-up automation
 * for the GreenChainz outreach system.
 */
import mongoose, { Schema, Model, Document } from 'mongoose';
import dbConnect from '../lib/mongodb';
import {
  LeadStatus,
  LeadType,
  EmailType,
  EmailStatus,
  LeadPriority,
  ILead,
  IEmail,
  LeadContext,
} from '../types/outreach';

// =============================================================================
// Mongoose Document Interface
// =============================================================================

export interface ILeadDocument extends Omit<ILead, '_id'>, Document {}

// =============================================================================
// Sub-Schemas
// =============================================================================

const EmailSchema = new Schema<IEmail>(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    htmlBody: { type: String },
    generatedAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(EmailStatus),
      default: EmailStatus.DRAFT,
    },
    type: {
      type: String,
      enum: Object.values(EmailType),
      required: true,
    },
    messageId: { type: String },
    openedAt: { type: Date },
    repliedAt: { type: Date },
  },
  { _id: false }
);

const LeadContextSchema = new Schema<LeadContext>(
  {
    companyDescription: { type: String },
    certifications: [{ type: String }],
    recentNews: { type: String },
    customHook: { type: String },
  },
  { _id: false }
);

// =============================================================================
// Main Lead Schema
// =============================================================================

const LeadSchema = new Schema<ILeadDocument>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [100, 'Role cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    leadType: {
      type: String,
      enum: Object.values(LeadType),
      required: [true, 'Lead type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
      index: true,
    },
    source: {
      type: String,
      required: [true, 'Lead source is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(LeadPriority),
      default: LeadPriority.MEDIUM,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    notes: {
      type: String,
      default: '',
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    
    // Email tracking
    emails: [EmailSchema],
    
    // Follow-up automation
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date, index: true },
    followUpCount: { type: Number, default: 0 },
    autoFollowUpEnabled: { type: Boolean, default: false },
    
    // Personalization context
    context: {
      type: LeadContextSchema,
      default: () => ({}),
    },
    
    createdBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// Indexes
// =============================================================================

// Compound index for follow-up queries
LeadSchema.index({ status: 1, nextFollowUpAt: 1 });

// Compound index for lead filtering
LeadSchema.index({ leadType: 1, priority: 1 });

// Descending index for sorting by creation date
LeadSchema.index({ createdAt: -1 });

// Text index for search
LeadSchema.index(
  { companyName: 'text', contactName: 'text', email: 'text' },
  { name: 'lead_search_index' }
);

// =============================================================================
// Model Cache and Export
// =============================================================================

let LeadModel: Model<ILeadDocument> | null = null;

export async function getLeadModel(): Promise<Model<ILeadDocument>> {
  if (LeadModel) return LeadModel;
  
  await dbConnect();
  
  // Check if model already exists (hot reload protection)
  if (mongoose.models['Lead']) {
    LeadModel = mongoose.models['Lead'] as Model<ILeadDocument>;
    return LeadModel;
  }
  
  LeadModel = mongoose.model<ILeadDocument>('Lead', LeadSchema);
  return LeadModel;
}

export default { getLeadModel };
