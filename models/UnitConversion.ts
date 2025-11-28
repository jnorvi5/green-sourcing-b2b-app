/**
 * UnitConversion Model - Material Density & Unit Conversion Tables
 * 
 * Pre-cached conversion factors for mass ↔ volume ↔ area calculations.
 * Critical for comparing products with different declared units.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUnitConversion extends Document {
    materialCategory: string;     // e.g., "Concrete", "Steel", "Wood"
    materialType?: string;        // e.g., "Ready-mix concrete", "Structural steel"

    // Density (for mass ↔ volume)
    density: number;              // kg/m³
    densityRange?: {
        min: number;
        max: number;
    };

    // Thickness (for area ↔ volume)
    typicalThickness?: number;    // meters (for sheet/panel products)
    thicknessUnit?: string;

    // Common Conversions
    conversions: {
        fromUnit: string;
        toUnit: string;
        factor: number;
        notes?: string;
    }[];

    // Functional Unit Info
    functionalUnit?: string;      // e.g., "1 m² of wall for 50 years"
    referenceServiceLife?: number; // years

    // Source
    source: string;
    dataQuality: 'high' | 'medium' | 'low' | 'estimated';

    lastUpdated: Date;
}

const UnitConversionSchema = new Schema<IUnitConversion>(
    {
        materialCategory: {
            type: String,
            required: true,
            index: true,
        },
        materialType: String,

        density: {
            type: Number,
            required: true,
        },
        densityRange: {
            min: Number,
            max: Number,
        },

        typicalThickness: Number,
        thicknessUnit: String,

        conversions: [{
            fromUnit: { type: String, required: true },
            toUnit: { type: String, required: true },
            factor: { type: Number, required: true },
            notes: String,
        }],

        functionalUnit: String,
        referenceServiceLife: Number,

        source: {
            type: String,
            default: 'GreenChainz',
        },
        dataQuality: {
            type: String,
            enum: ['high', 'medium', 'low', 'estimated'],
            default: 'medium',
        },

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'unit_conversions',
    }
);

UnitConversionSchema.index({ materialCategory: 1, materialType: 1 });

export const UnitConversion: Model<IUnitConversion> =
    mongoose.models.UnitConversion || mongoose.model<IUnitConversion>('UnitConversion', UnitConversionSchema);

export default UnitConversion;
