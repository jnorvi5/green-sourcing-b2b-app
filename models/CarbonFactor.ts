/**
 * CarbonFactor Model - Regional Carbon Emission Factors
 * 
 * Pre-cached grid electricity factors, transport emissions, etc.
 * Eliminates need for real-time API calls for location-based calculations.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICarbonFactor extends Document {
    factorId: string;
    type: 'electricity' | 'transport' | 'fuel' | 'water' | 'waste';

    // Location
    region: string;               // "North America", "Europe", "Asia Pacific"
    country: string;              // ISO 3166-1 alpha-2
    subregion?: string;           // State/Province/Grid region

    // Factor Data
    factor: number;               // Emission factor value
    unit: string;                 // e.g., "kg CO2e/kWh", "kg CO2e/ton-km"

    // For electricity grids
    gridMix?: {
        coal: number;
        naturalGas: number;
        nuclear: number;
        hydro: number;
        wind: number;
        solar: number;
        other: number;
    };

    // Source & Validity
    source: string;               // "EPA eGRID", "IEA", "DEFRA", etc.
    year: number;                 // Data year
    validFrom: Date;
    validUntil?: Date;

    // Metadata
    notes?: string;
    lastUpdated: Date;
}

const CarbonFactorSchema = new Schema<ICarbonFactor>(
    {
        factorId: {
            type: String,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['electricity', 'transport', 'fuel', 'water', 'waste'],
            index: true,
        },

        region: {
            type: String,
            required: true,
            index: true,
        },
        country: {
            type: String,
            required: true,
            index: true,
        },
        subregion: String,

        factor: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            required: true,
        },

        gridMix: {
            coal: Number,
            naturalGas: Number,
            nuclear: Number,
            hydro: Number,
            wind: Number,
            solar: Number,
            other: Number,
        },

        source: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validUntil: Date,

        notes: String,
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'carbon_factors',
    }
);

CarbonFactorSchema.index({ type: 1, country: 1 });
CarbonFactorSchema.index({ country: 1, subregion: 1 });

export const CarbonFactor: Model<ICarbonFactor> =
    mongoose.models.CarbonFactor || mongoose.model<ICarbonFactor>('CarbonFactor', CarbonFactorSchema);

export default CarbonFactor;
