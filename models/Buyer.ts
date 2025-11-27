/**
 * Buyer Model - Buyers Database
 * 
 * Stores buyer company profiles, preferences, and procurement settings
 */
import { Schema, Model, Document } from 'mongoose';
import { getBuyersDB } from '../lib/databases';

export interface IBuyer extends Document {
    // Identity
    userId: string;
    email: string;

    // Company Info
    company: {
        name: string;
        industry: string;
        size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
        website?: string;
        logo?: string;
        description?: string;
    };

    // Contact
    contact: {
        firstName: string;
        lastName: string;
        title?: string;
        phone?: string;
        department?: string;
    };

    // Address
    address: {
        street?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    // Procurement Preferences
    procurement: {
        budget: {
            monthly?: number;
            quarterly?: number;
            annual?: number;
        };
        preferredCategories: string[];
        sustainabilityRequirements: {
            minCarbonScore?: number;
            requiredCertifications: string[];
            preferLocalSuppliers: boolean;
            maxShippingDistance?: number;
        };
        paymentTerms: string[];
        approvalWorkflow: {
            enabled: boolean;
            thresholds: Array<{
                amount: number;
                approvers: string[];
            }>;
        };
    };

    // Metrics
    metrics: {
        totalSpend: number;
        totalOrders: number;
        totalCarbonSaved: number;
        avgOrderValue: number;
        supplierCount: number;
        lastOrderDate?: Date;
    };

    // Settings
    settings: {
        notifications: {
            email: boolean;
            push: boolean;
            rfqUpdates: boolean;
            orderUpdates: boolean;
            priceAlerts: boolean;
        };
        currency: string;
        timezone: string;
        language: string;
    };

    // Status
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    tier: 'free' | 'starter' | 'professional' | 'enterprise';

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}

const BuyerSchema = new Schema<IBuyer>({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },

    company: {
        name: { type: String, required: true },
        industry: { type: String, required: true },
        size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
        website: String,
        logo: String,
        description: String,
    },

    contact: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        title: String,
        phone: String,
        department: String,
    },

    address: {
        street: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'United States' },
    },

    procurement: {
        budget: {
            monthly: Number,
            quarterly: Number,
            annual: Number,
        },
        preferredCategories: [{ type: String }],
        sustainabilityRequirements: {
            minCarbonScore: Number,
            requiredCertifications: [{ type: String }],
            preferLocalSuppliers: { type: Boolean, default: false },
            maxShippingDistance: Number,
        },
        paymentTerms: [{ type: String }],
        approvalWorkflow: {
            enabled: { type: Boolean, default: false },
            thresholds: [{
                amount: Number,
                approvers: [{ type: String }],
            }],
        },
    },

    metrics: {
        totalSpend: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalCarbonSaved: { type: Number, default: 0 },
        avgOrderValue: { type: Number, default: 0 },
        supplierCount: { type: Number, default: 0 },
        lastOrderDate: Date,
    },

    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            rfqUpdates: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
            priceAlerts: { type: Boolean, default: false },
        },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'America/New_York' },
        language: { type: String, default: 'en' },
    },

    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' },
    tier: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'free' },

    lastLoginAt: Date,
}, {
    timestamps: true,
});

// Indexes for common queries
BuyerSchema.index({ 'company.name': 'text', email: 'text' });
BuyerSchema.index({ 'company.industry': 1 });
BuyerSchema.index({ status: 1 });
BuyerSchema.index({ tier: 1 });
BuyerSchema.index({ 'metrics.totalSpend': -1 });

// Model cache
let BuyerModel: Model<IBuyer> | null = null;

export async function getBuyerModel(): Promise<Model<IBuyer>> {
    if (BuyerModel) return BuyerModel;

    const conn = await getBuyersDB();
    BuyerModel = conn.model<IBuyer>('Buyer', BuyerSchema);
    return BuyerModel;
}

export default { getBuyerModel };
