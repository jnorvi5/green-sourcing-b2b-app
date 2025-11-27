/**
 * Data Providers Models - Data Providers Database
 * 
 * Caches for external data sources:
 * - EC3 (Carbon emissions)
 * - Autodesk APS (Building/material data)
 * - EPD databases
 * - Third-party APIs
 */
import { Schema, Model, Document } from 'mongoose';
import { getDataProvidersDB } from '../lib/databases';

// ==================== EC3 Carbon Data Cache ====================
export interface IEC3Material extends Document {
    ec3Id: string;
    name: string;
    category: string;
    subcategory?: string;
    manufacturer?: string;
    description?: string;

    // Carbon metrics
    gwp: number; // Global Warming Potential (kgCO2e)
    gwpUnit: string;
    gwpUncertainty?: number;

    // Material properties
    density?: number;
    densityUnit?: string;
    strength?: number;
    strengthUnit?: string;

    // Location/availability
    country: string;
    region?: string;
    plantLocation?: string;

    // Compliance & verification
    epdId?: string;
    epdUrl?: string;
    programOperator?: string;
    verificationStatus: 'unverified' | 'third_party' | 'self_declared';

    // Dates
    publicationDate?: Date;
    validUntil?: Date;

    // Raw data
    rawData?: Record<string, unknown>;

    // Cache metadata
    fetchedAt: Date;
    expiresAt: Date;
    source: string;
}

const EC3MaterialSchema = new Schema<IEC3Material>({
    ec3Id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: String,
    manufacturer: String,
    description: String,

    gwp: { type: Number, required: true },
    gwpUnit: { type: String, default: 'kgCO2e' },
    gwpUncertainty: Number,

    density: Number,
    densityUnit: String,
    strength: Number,
    strengthUnit: String,

    country: { type: String, required: true, index: true },
    region: String,
    plantLocation: String,

    epdId: { type: String, index: true },
    epdUrl: String,
    programOperator: String,
    verificationStatus: {
        type: String,
        enum: ['unverified', 'third_party', 'self_declared'],
        default: 'unverified',
    },

    publicationDate: Date,
    validUntil: Date,

    rawData: { type: Schema.Types.Mixed },

    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    source: { type: String, default: 'ec3' },
});

EC3MaterialSchema.index({ name: 'text', description: 'text', manufacturer: 'text' });
EC3MaterialSchema.index({ gwp: 1 });
EC3MaterialSchema.index({ category: 1, gwp: 1 });

// ==================== Autodesk APS Cache ====================
export interface IAutodeskMaterial extends Document {
    apsId: string;
    name: string;
    class: string;
    category?: string;

    // Physical properties
    properties: {
        density?: number;
        thermalConductivity?: number;
        specificHeat?: number;
        porosity?: number;
        compressiveStrength?: number;
        tensileStrength?: number;
    };

    // Appearance
    appearance?: {
        color?: string;
        texture?: string;
        finish?: string;
    };

    // Sustainability
    sustainability?: {
        recycledContent?: number;
        recyclable?: boolean;
        voc?: number;
        embodiedCarbon?: number;
    };

    // Standards & codes
    standards?: string[];

    // Raw data
    rawData?: Record<string, unknown>;

    // Cache metadata
    fetchedAt: Date;
    expiresAt: Date;
    source: string;
}

const AutodeskMaterialSchema = new Schema<IAutodeskMaterial>({
    apsId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    class: { type: String, required: true, index: true },
    category: String,

    properties: {
        density: Number,
        thermalConductivity: Number,
        specificHeat: Number,
        porosity: Number,
        compressiveStrength: Number,
        tensileStrength: Number,
    },

    appearance: {
        color: String,
        texture: String,
        finish: String,
    },

    sustainability: {
        recycledContent: Number,
        recyclable: Boolean,
        voc: Number,
        embodiedCarbon: Number,
    },

    standards: [{ type: String }],

    rawData: { type: Schema.Types.Mixed },

    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    source: { type: String, default: 'autodesk_aps' },
});

AutodeskMaterialSchema.index({ name: 'text' });

// ==================== Carbon Factor ====================
export interface ICarbonFactor extends Document {
    factorId: string;
    name: string;
    category: string;
    subcategory?: string;

    // Factor values
    factor: number;
    unit: string;
    scope: 1 | 2 | 3;

    // Geographic specificity
    country: string;
    region?: string;

    // Source & methodology
    source: string;
    methodology?: string;
    dataQuality: 'high' | 'medium' | 'low';

    // Validity
    year: number;
    validFrom: Date;
    validTo?: Date;

    // References
    reference?: string;
    referenceUrl?: string;

    // Cache metadata
    fetchedAt: Date;
    expiresAt: Date;
}

const CarbonFactorSchema = new Schema<ICarbonFactor>({
    factorId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: String,

    factor: { type: Number, required: true },
    unit: { type: String, required: true },
    scope: { type: Number, enum: [1, 2, 3], required: true },

    country: { type: String, required: true, index: true },
    region: String,

    source: { type: String, required: true },
    methodology: String,
    dataQuality: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },

    year: { type: Number, required: true },
    validFrom: { type: Date, required: true },
    validTo: Date,

    reference: String,
    referenceUrl: String,

    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
});

CarbonFactorSchema.index({ category: 1, country: 1 });

// ==================== API Request Log ====================
export interface IAPIRequestLog extends Document {
    provider: string;
    endpoint: string;
    method: string;
    requestParams?: Record<string, unknown>;
    responseStatus: number;
    responseTime: number; // ms
    success: boolean;
    errorMessage?: string;
    cacheHit: boolean;
    userId?: string;
    timestamp: Date;
}

const APIRequestLogSchema = new Schema<IAPIRequestLog>({
    provider: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    requestParams: { type: Schema.Types.Mixed },
    responseStatus: { type: Number, required: true },
    responseTime: { type: Number, required: true },
    success: { type: Boolean, required: true },
    errorMessage: String,
    cacheHit: { type: Boolean, default: false },
    userId: String,
    timestamp: { type: Date, default: Date.now, index: true },
});

// TTL - auto-delete logs older than 30 days
APIRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ==================== Model Factory ====================
interface DataProviderModels {
    EC3Material: Model<IEC3Material>;
    AutodeskMaterial: Model<IAutodeskMaterial>;
    CarbonFactor: Model<ICarbonFactor>;
    APIRequestLog: Model<IAPIRequestLog>;
}

let models: DataProviderModels | null = null;

export async function getDataProviderModels(): Promise<DataProviderModels> {
    if (models) return models;

    const conn = await getDataProvidersDB();

    models = {
        EC3Material: conn.model<IEC3Material>('EC3Material', EC3MaterialSchema),
        AutodeskMaterial: conn.model<IAutodeskMaterial>('AutodeskMaterial', AutodeskMaterialSchema),
        CarbonFactor: conn.model<ICarbonFactor>('CarbonFactor', CarbonFactorSchema),
        APIRequestLog: conn.model<IAPIRequestLog>('APIRequestLog', APIRequestLogSchema),
    };

    return models;
}

// Export individual model getters
export const getEC3MaterialModel = async () => (await getDataProviderModels()).EC3Material;
export const getAutodeskMaterialModel = async () => (await getDataProviderModels()).AutodeskMaterial;
export const getCarbonFactorModel = async () => (await getDataProviderModels()).CarbonFactor;
export const getAPIRequestLogModel = async () => (await getDataProviderModels()).APIRequestLog;

export default { getDataProviderModels };
