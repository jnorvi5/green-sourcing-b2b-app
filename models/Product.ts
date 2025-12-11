/**
 * Product Model for MongoDB (Mongoose)
 * 
 * Comprehensive schema for sustainable products in the GreenChainz marketplace.
 * Stores "Green Data" including EPDs, sustainability metrics, and certifications.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Green Data sub-schema interface for sustainability metrics
 */
export interface IGreenData {
  epdId?: string;                    // Environmental Product Declaration ID
  carbonFootprint?: number;          // kg CO2e per unit
  recycledContent?: number;          // percentage 0-100
  renewableEnergy?: number;          // percentage 0-100
  waterUsage?: number;               // liters per unit
  certifications?: string[];         // e.g., ['FSC', 'LEED', 'Cradle to Cradle']
  lifecycleStage?: string;
  customMetrics?: Record<string, unknown>; // Flexible object for additional metrics
}

/**
 * Product document interface
 */
export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  supplierId: string;
  supplierName?: string;
  category: string;
  subcategory?: string;
  images: string[];
  certificates: string[];
  status: 'draft' | 'active' | 'archived';
  minOrderQuantity: number;
  unitOfMeasure: string;
  leadTimeDays?: number;
  tags: string[];
  greenData?: IGreenData;
  createdAt: Date;
  updatedAt: Date;
  sustainabilityScore: number;
}

/**
 * Green Data sub-schema
 */
const GreenDataSchema = new Schema<IGreenData>(
  {
    epdId: { type: String },
    carbonFootprint: { type: Number },
    recycledContent: {
      type: Number,
      min: 0,
      max: 100,
    },
    renewableEnergy: {
      type: Number,
      min: 0,
      max: 100,
    },
    waterUsage: { type: Number },
    certifications: [{ type: String }],
    lifecycleStage: { type: String },
    customMetrics: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/**
 * Main Product schema
 */
const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD'],
      default: 'USD',
    },
    supplierId: {
      type: String,
      required: [true, 'Supplier ID is required'],
      index: true,
    },
    supplierName: {
      type: String,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: String,
    },
    images: {
      type: [String],
      validate: {
        validator: function (arr: string[]) {
          return arr.length <= 10;
        },
        message: 'Cannot have more than 10 images',
      },
    },
    certificates: {
      type: [String],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    minOrderQuantity: {
      type: Number,
      min: [1, 'Minimum order quantity must be at least 1'],
      default: 1,
    },
    unitOfMeasure: {
      type: String,
      default: 'unit',
    },
    leadTimeDays: {
      type: Number,
      min: [0, 'Lead time cannot be negative'],
    },
    tags: {
      type: [String],
      set: function (tags: string[]) {
        return tags.map((tag) => tag.toLowerCase().trim());
      },
    },
    greenData: GreenDataSchema,
  },
  {
    timestamps: true,
  }
);

/**
 * Virtual getter for sustainability score
 * Calculates a composite score based on greenData metrics
 */
ProductSchema.virtual('sustainabilityScore').get(function (this: IProduct) {
  if (!this.greenData) return 0;

  let score = 0;
  let factors = 0;

  // Recycled content contribution (0-30 points)
  if (this.greenData.recycledContent !== undefined) {
    score += (this.greenData.recycledContent / 100) * 30;
    factors++;
  }

  // Renewable energy contribution (0-25 points)
  if (this.greenData.renewableEnergy !== undefined) {
    score += (this.greenData.renewableEnergy / 100) * 25;
    factors++;
  }

  // Carbon footprint penalty (lower is better, 0-25 points)
  if (this.greenData.carbonFootprint !== undefined) {
    // Assume 100 kg CO2e as a high baseline, scale inversely
    const carbonScore = Math.max(0, 25 - (this.greenData.carbonFootprint / 100) * 25);
    score += carbonScore;
    factors++;
  }

  // Certifications bonus (up to 20 points, 4 points per certification)
  if (this.greenData.certifications && this.greenData.certifications.length > 0) {
    score += Math.min(this.greenData.certifications.length * 4, 20);
    factors++;
  }

  // EPD presence bonus (5 points)
  if (this.greenData.epdId) {
    score += 5;
  }

  // Return average score if factors exist, otherwise 0
  return factors > 0 ? Math.round(score) : 0;
});

// Ensure virtuals are included when converting to JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

/**
 * Compound indexes for common query patterns
 */
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ supplierId: 1, status: 1 });
ProductSchema.index({ 'greenData.certifications': 1 });
ProductSchema.index({ tags: 1 });

/**
 * Text index for full-text search on title, description, and tags
 */
ProductSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } }
);

/**
 * Prevent model recompilation in serverless environments
 */
const Product: Model<IProduct> =
  mongoose.models['Product'] || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
