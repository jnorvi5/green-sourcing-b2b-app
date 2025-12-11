/**
 * EPDProgram Model - EPD Program Operator Registry
 * 
 * Valid PCR programs and their validation rules.
 * Used to verify EPD authenticity without external API calls.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEPDProgram extends Document {
    programId: string;
    name: string;
    shortName: string;            // e.g., "EPD International", "UL", "ICC-ES"

    // Program Details
    website: string;
    registryUrl?: string;         // URL to search their EPD registry
    logoUrl?: string;

    // Geographic Coverage
    regions: string[];            // ["Global", "North America", "Europe"]
    headquarters: string;         // Country

    // Validation
    epdPrefix?: string;           // EPD ID prefix pattern
    epdPattern?: string;          // Regex for valid EPD IDs
    verificationUrl?: string;     // API/page to verify EPDs

    // Standards
    standards: string[];          // ["ISO 14025", "EN 15804", "ISO 21930"]
    pcrCategories: string[];      // Product Category Rules they cover

    // Contact
    contactEmail?: string;

    // Status
    isActive: boolean;
    accreditedBy?: string[];      // Accreditation bodies

    lastUpdated: Date;
}

const EPDProgramSchema = new Schema<IEPDProgram>(
    {
        programId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        shortName: {
            type: String,
            required: true,
            index: true,
        },

        website: {
            type: String,
            required: true,
        },
        registryUrl: String,
        logoUrl: String,

        regions: [String],
        headquarters: String,

        epdPrefix: String,
        epdPattern: String,
        verificationUrl: String,

        standards: [String],
        pcrCategories: [String],

        contactEmail: String,

        isActive: {
            type: Boolean,
            default: true,
        },
        accreditedBy: [String],

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'epd_programs',
    }
);

export const EPDProgram: Model<IEPDProgram> =
    mongoose.models['EPDProgram'] || mongoose.model<IEPDProgram>('EPDProgram', EPDProgramSchema);

export default EPDProgram;
