/**
 * CarbonAlternative Model - Low-Carbon Material Swaps
 * 
 * Pre-computed "swap this for that" recommendations.
 * Enables instant carbon reduction suggestions without real-time calculation.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICarbonAlternative extends Document {
    originalMaterial: {
        category: string;
        name: string;
        gwp: number;                // kg CO2e per unit
        unit: string;
    };

    alternatives: {
        name: string;
        category: string;
        gwp: number;
        unit: string;
        reduction: number;          // % reduction vs original
        reductionAbsolute: number;  // kg CO2e saved per unit

        // Compatibility
        compatibility: 'drop-in' | 'similar' | 'requires-redesign';
        considerations?: string[];  // Things to consider when swapping

        // Cost Impact
        costImpact?: 'lower' | 'similar' | 'higher' | 'much-higher';
        costMultiplier?: number;    // e.g., 1.2 = 20% more expensive

        // Availability
        availability: 'widely-available' | 'limited' | 'emerging';
        regions?: string[];

        // Performance
        performanceNotes?: string;
        strengthRatio?: number;     // e.g., 0.9 = 90% as strong

        // Source/Evidence
        source?: string;
        caseStudies?: string[];
    }[];

    // Use Cases
    applications: string[];       // e.g., ["Structural", "Non-structural", "Interior"]
    projectTypes?: string[];      // e.g., ["Commercial", "Residential", "Infrastructure"]

    // Metadata
    lastUpdated: Date;
    dataQuality: 'verified' | 'calculated' | 'estimated';
}

const CarbonAlternativeSchema = new Schema<ICarbonAlternative>(
    {
        originalMaterial: {
            category: { type: String, required: true },
            name: { type: String, required: true },
            gwp: { type: Number, required: true },
            unit: { type: String, required: true },
        },

        alternatives: [{
            name: { type: String, required: true },
            category: { type: String, required: true },
            gwp: { type: Number, required: true },
            unit: { type: String, required: true },
            reduction: { type: Number, required: true },
            reductionAbsolute: { type: Number, required: true },

            compatibility: {
                type: String,
                enum: ['drop-in', 'similar', 'requires-redesign'],
                default: 'similar',
            },
            considerations: [String],

            costImpact: {
                type: String,
                enum: ['lower', 'similar', 'higher', 'much-higher'],
            },
            costMultiplier: Number,

            availability: {
                type: String,
                enum: ['widely-available', 'limited', 'emerging'],
                default: 'widely-available',
            },
            regions: [String],

            performanceNotes: String,
            strengthRatio: Number,

            source: String,
            caseStudies: [String],
        }],

        applications: [String],
        projectTypes: [String],

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
        dataQuality: {
            type: String,
            enum: ['verified', 'calculated', 'estimated'],
            default: 'calculated',
        },
    },
    {
        timestamps: true,
        collection: 'carbon_alternatives',
    }
);

CarbonAlternativeSchema.index({ 'originalMaterial.category': 1 });
CarbonAlternativeSchema.index({ 'originalMaterial.name': 'text' });

export const CarbonAlternative: Model<ICarbonAlternative> =
    mongoose.models.CarbonAlternative || mongoose.model<ICarbonAlternative>('CarbonAlternative', CarbonAlternativeSchema);

export default CarbonAlternative;
