/**
 * Material Model - Cached Autodesk/EC3 Material Data
 * 
 * Pre-fetched material carbon data to avoid per-request API calls.
 * Sources: Autodesk Construction Cloud, EC3, EPD databases
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
    // Identifiers
    materialId: string;           // Unique material identifier
    ec3Id?: string;               // EC3 database ID
    autodeskId?: string;          // Autodesk material ID

    // Basic Info
    name: string;
    description?: string;
    category: string;             // MasterFormat division
    subcategory?: string;

    // Classification
    masterFormat?: string;        // MasterFormat code (e.g., "03 30 00")
    omniClass?: string;           // OmniClass code
    uniformat?: string;           // UniFormat code

    // Carbon Data (GWP = Global Warming Potential)
    gwp: number;                  // kg CO2e per declared unit
    gwpUnit: string;              // e.g., "kg CO2e/m³", "kg CO2e/kg"
    declaredUnit: string;         // e.g., "1 m³", "1 kg", "1 m²"
    density?: number;             // kg/m³ for conversions

    // Lifecycle Stages (EN 15804)
    lifecycleStages: {
        a1a3?: number;              // Raw material + Manufacturing
        a4?: number;                // Transport to site
        a5?: number;                // Installation
        b1b7?: number;              // Use stage
        c1c4?: number;              // End of life
        d?: number;                 // Beyond system boundary (recycling credit)
    };

    // Benchmarks
    benchmarks: {
        percentile?: number;        // Where this falls (0-100)
        industryAvg?: number;       // Industry average GWP
        bestInClass?: number;       // Best available GWP
        worstInClass?: number;      // Worst GWP
    };

    // Source & Validity
    source: string;               // "EC3", "Autodesk", "EPD International", etc.
    epdProgramOperator?: string;  // PCR program
    validUntil?: Date;            // EPD expiry
    lastUpdated: Date;
    dataQuality?: 'high' | 'medium' | 'low' | 'estimated';

    // Geographic
    region?: string;              // "North America", "Europe", etc.
    country?: string;

    // Metadata
    tags: string[];
    alternatives?: string[];      // Material IDs of lower-carbon alternatives
}

const MaterialSchema = new Schema<IMaterial>(
    {
        materialId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        ec3Id: String,
        autodeskId: String,

        name: {
            type: String,
            required: true,
            index: 'text',
        },
        description: String,
        category: {
            type: String,
            required: true,
            index: true,
        },
        subcategory: String,

        masterFormat: String,
        omniClass: String,
        uniformat: String,

        gwp: {
            type: Number,
            required: true,
            index: true,
        },
        gwpUnit: {
            type: String,
            required: true,
            default: 'kg CO2e/kg',
        },
        declaredUnit: {
            type: String,
            required: true,
            default: '1 kg',
        },
        density: Number,

        lifecycleStages: {
            a1a3: Number,
            a4: Number,
            a5: Number,
            b1b7: Number,
            c1c4: Number,
            d: Number,
        },

        benchmarks: {
            percentile: Number,
            industryAvg: Number,
            bestInClass: Number,
            worstInClass: Number,
        },

        source: {
            type: String,
            required: true,
            default: 'GreenChainz',
        },
        epdProgramOperator: String,
        validUntil: Date,
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
        dataQuality: {
            type: String,
            enum: ['high', 'medium', 'low', 'estimated'],
            default: 'medium',
        },

        region: String,
        country: String,

        tags: [String],
        alternatives: [String],
    },
    {
        timestamps: true,
        collection: 'materials',
    }
);

// Indexes for common queries
MaterialSchema.index({ category: 1, gwp: 1 });
MaterialSchema.index({ masterFormat: 1 });
MaterialSchema.index({ 'benchmarks.percentile': 1 });

export const Material: Model<IMaterial> =
    mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;
