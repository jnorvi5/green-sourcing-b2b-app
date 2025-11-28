/**
 * Supplier Model - Suppliers Database
 * 
 * Comprehensive supplier profiles with certifications, inventory, and analytics
 */
import { Schema, Model, Document } from 'mongoose';
import { getSuppliersDB } from '../lib/databases';

export interface ISupplier extends Document {
    // Identity
    userId: string;
    email: string;

    // Company Info
    company: {
        name: string;
        legalName?: string;
        dba?: string;
        taxId?: string;
        duns?: string;
        founded: number;
        industry: string;
        size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
        website: string;
        logo?: string;
        coverImage?: string;
        description: string;
        tagline?: string;
    };

    // Primary Contact
    contact: {
        firstName: string;
        lastName: string;
        title: string;
        email: string;
        phone: string;
    };

    // Additional Contacts
    contacts: Array<{
        type: 'sales' | 'support' | 'billing' | 'technical' | 'executive';
        name: string;
        email: string;
        phone?: string;
        title?: string;
    }>;

    // Locations
    headquarters: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };

    facilities: Array<{
        name: string;
        type: 'manufacturing' | 'warehouse' | 'office' | 'distribution';
        address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        capabilities: string[];
    }>;

    // Product Categories & Capabilities
    categories: string[];
    subcategories: string[];
    capabilities: {
        customManufacturing: boolean;
        privateLabel: boolean;
        dropShipping: boolean;
        justInTime: boolean;
        consignment: boolean;
    };

    // Certifications
    certifications: Array<{
        name: string;
        issuer: string;
        certificateNumber?: string;
        issueDate: Date;
        expiryDate: Date;
        documentUrl?: string;
        verified: boolean;
    }>;

    // Sustainability
    sustainability: {
        carbonScore: number; // 0-100
        programs: string[];
        commitments: string[];
        reporting: {
            scope1Emissions?: number;
            scope2Emissions?: number;
            scope3Emissions?: number;
            renewableEnergy: number; // percentage
            wasteReduction: number; // percentage
            waterUsage?: number;
        };
        goals: Array<{
            target: string;
            deadline: Date;
            progress: number;
        }>;
    };

    // Business Terms
    businessTerms: {
        minimumOrder: number;
        currency: string;
        paymentTerms: string[];
        acceptedPaymentMethods: string[];
        leadTimeDays: {
            min: number;
            max: number;
        };
        shippingRegions: string[];
        freeShippingThreshold?: number;
        returnPolicy?: string;
    };

    // Metrics & Analytics
    metrics: {
        totalRevenue: number;
        totalOrders: number;
        totalProducts: number;
        avgOrderValue: number;
        avgLeadTime: number;
        onTimeDeliveryRate: number;
        returnRate: number;
        customerCount: number;
        repeatCustomerRate: number;
        rfqResponseRate: number;
        rfqWinRate: number;
        avgRating: number;
        reviewCount: number;
    };

    // Performance Scores
    scores: {
        overall: number;
        quality: number;
        reliability: number;
        communication: number;
        sustainability: number;
        pricing: number;
    };

    // Status
    status: 'pending' | 'active' | 'suspended' | 'inactive';
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    tier: 'basic' | 'professional' | 'enterprise' | 'charter175';

    // Badges & Recognition
    badges: Array<{
        type: string;
        name: string;
        awardedAt: Date;
        description?: string;
    }>;

    // Social
    socialMedia: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    profileCompleteness: number; // percentage
}

const SupplierSchema = new Schema<ISupplier>({
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },

    company: {
        name: { type: String, required: true },
        legalName: String,
        dba: String,
        taxId: String,
        duns: String,
        founded: Number,
        industry: { type: String, required: true },
        size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
        website: { type: String, required: true },
        logo: String,
        coverImage: String,
        description: { type: String, required: true },
        tagline: String,
    },

    contact: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        title: String,
        email: { type: String, required: true },
        phone: String,
    },

    contacts: [{
        type: { type: String, enum: ['sales', 'support', 'billing', 'technical', 'executive'] },
        name: String,
        email: String,
        phone: String,
        title: String,
    }],

    headquarters: {
        street: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: String,
        country: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number,
        },
    },

    facilities: [{
        name: String,
        type: { type: String, enum: ['manufacturing', 'warehouse', 'office', 'distribution'] },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        capabilities: [{ type: String }],
    }],

    categories: [{ type: String, index: true }],
    subcategories: [{ type: String }],

    capabilities: {
        customManufacturing: { type: Boolean, default: false },
        privateLabel: { type: Boolean, default: false },
        dropShipping: { type: Boolean, default: false },
        justInTime: { type: Boolean, default: false },
        consignment: { type: Boolean, default: false },
    },

    certifications: [{
        name: { type: String, required: true },
        issuer: String,
        certificateNumber: String,
        issueDate: Date,
        expiryDate: Date,
        documentUrl: String,
        verified: { type: Boolean, default: false },
    }],

    sustainability: {
        carbonScore: { type: Number, default: 0, min: 0, max: 100 },
        programs: [{ type: String }],
        commitments: [{ type: String }],
        reporting: {
            scope1Emissions: Number,
            scope2Emissions: Number,
            scope3Emissions: Number,
            renewableEnergy: { type: Number, default: 0 },
            wasteReduction: { type: Number, default: 0 },
            waterUsage: Number,
        },
        goals: [{
            target: String,
            deadline: Date,
            progress: { type: Number, default: 0 },
        }],
    },

    businessTerms: {
        minimumOrder: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        paymentTerms: [{ type: String }],
        acceptedPaymentMethods: [{ type: String }],
        leadTimeDays: {
            min: { type: Number, default: 1 },
            max: { type: Number, default: 30 },
        },
        shippingRegions: [{ type: String }],
        freeShippingThreshold: Number,
        returnPolicy: String,
    },

    metrics: {
        totalRevenue: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalProducts: { type: Number, default: 0 },
        avgOrderValue: { type: Number, default: 0 },
        avgLeadTime: { type: Number, default: 0 },
        onTimeDeliveryRate: { type: Number, default: 100 },
        returnRate: { type: Number, default: 0 },
        customerCount: { type: Number, default: 0 },
        repeatCustomerRate: { type: Number, default: 0 },
        rfqResponseRate: { type: Number, default: 0 },
        rfqWinRate: { type: Number, default: 0 },
        avgRating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
    },

    scores: {
        overall: { type: Number, default: 0 },
        quality: { type: Number, default: 0 },
        reliability: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        sustainability: { type: Number, default: 0 },
        pricing: { type: Number, default: 0 },
    },

    status: { type: String, enum: ['pending', 'active', 'suspended', 'inactive'], default: 'pending' },
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
    tier: { type: String, enum: ['basic', 'professional', 'enterprise', 'charter175'], default: 'basic' },

    badges: [{
        type: { type: String },
        name: String,
        awardedAt: Date,
        description: String,
    }],

    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String,
        youtube: String,
    },

    lastLoginAt: Date,
    profileCompleteness: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Indexes
SupplierSchema.index({ 'company.name': 'text', 'company.description': 'text' });
SupplierSchema.index({ categories: 1 });
SupplierSchema.index({ status: 1, verificationStatus: 1 });
SupplierSchema.index({ tier: 1 });
SupplierSchema.index({ 'sustainability.carbonScore': -1 });
SupplierSchema.index({ 'scores.overall': -1 });
SupplierSchema.index({ 'metrics.totalRevenue': -1 });
SupplierSchema.index({ 'headquarters.country': 1, 'headquarters.state': 1 });

// Model cache
let SupplierModel: Model<ISupplier> | null = null;

export async function getSupplierModel(): Promise<Model<ISupplier>> {
    if (SupplierModel) return SupplierModel;

    const conn = await getSuppliersDB();
    SupplierModel = conn.model<ISupplier>('Supplier', SupplierSchema);
    return SupplierModel;
}

export default { getSupplierModel };
