/**
 * MongoDB Seed Script for GreenChainz
 * 
 * Populates the database with a "Golden Sample" product for UI demonstration.
 * 
 * Usage: npm run seed (from the frontend directory)
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define the greenData interface for type safety
interface GreenData {
  gwp: number;
  verified: boolean;
  source: string;
}

// Define the product interface
interface SeedProduct {
  title: string;
  description: string;
  price: number;
  supplierId: string;
  greenData: GreenData;
  images: string[];
  category: string;
  status: 'draft' | 'active' | 'archived';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  minOrderQuantity: number;
  unitOfMeasure: string;
  certificates: string[];
  tags: string[];
}

// Golden Sample product data
const goldenProduct: SeedProduct = {
  title: 'Heirloom Carbon-Negative Concrete',
  description: 'Structural concrete that permanently stores CO2 via direct air capture technology. 4000 psi.',
  price: 150.00,
  supplierId: 'seed-supplier-01',
  greenData: {
    gwp: -15,
    verified: true,
    source: 'Autodesk',
  },
  images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'],
  // Required fields from the Product model with sensible defaults
  category: 'Building Materials',
  status: 'active',
  currency: 'USD',
  minOrderQuantity: 1,
  unitOfMeasure: 'cubic yard',
  certificates: [],
  tags: ['carbon-negative', 'concrete', 'sustainable', 'direct-air-capture'],
};

// Define the GreenData schema
const GreenDataSchema = new mongoose.Schema(
  {
    epdId: { type: String },
    carbonFootprint: { type: Number },
    recycledContent: { type: Number, min: 0, max: 100 },
    renewableEnergy: { type: Number, min: 0, max: 100 },
    waterUsage: { type: Number },
    certifications: [{ type: String }],
    lifecycleStage: { type: String },
    customMetrics: { type: mongoose.Schema.Types.Mixed },
    // Additional fields for the golden product
    gwp: { type: Number },
    verified: { type: Boolean },
    source: { type: String },
  },
  { _id: false }
);

// Define the Product schema (matching models/Product.ts)
const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'CAD'], default: 'USD' },
    supplierId: { type: String, required: true, index: true },
    supplierName: { type: String },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    images: { type: [String] },
    certificates: { type: [String] },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    minOrderQuantity: { type: Number, min: 1, default: 1 },
    unitOfMeasure: { type: String, default: 'unit' },
    leadTimeDays: { type: Number, min: 0 },
    tags: { type: [String] },
    greenData: GreenDataSchema,
  },
  { timestamps: true }
);

// Get or create the Product model
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable is not defined.');
    console.error('   Please set MONGODB_URI in your .env file or environment.');
    process.exit(1);
  }

  console.log('🌱 Starting MongoDB seed script...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully!\n');

    // Clear existing products to avoid duplicates
    console.log('🧹 Clearing existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`   Removed ${deleteResult.deletedCount} existing product(s).\n`);

    // Insert the golden sample product
    console.log('📦 Inserting Golden Sample product...');
    const newProduct = new Product(goldenProduct);
    const savedProduct = await newProduct.save();
    
    console.log('✅ Product inserted successfully!\n');
    console.log('📋 Product Details:');
    console.log(`   ID:          ${savedProduct._id}`);
    console.log(`   Title:       ${savedProduct.title}`);
    console.log(`   Price:       $${savedProduct.price.toFixed(2)}`);
    console.log(`   Category:    ${savedProduct.category}`);
    console.log(`   Supplier ID: ${savedProduct.supplierId}`);
    console.log(`   GWP:         ${savedProduct.greenData?.gwp} kg CO2e`);
    console.log(`   Verified:    ${savedProduct.greenData?.verified ? 'Yes' : 'No'}`);
    console.log(`   Source:      ${savedProduct.greenData?.source}\n`);

    console.log('🎉 Seed completed successfully!');

  } catch (error) {
    console.error('\n❌ Seed failed with error:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
        console.error('\n💡 Tip: Check your MONGODB_URI and network connection.');
      }
    } else {
      console.error(error);
    }
    process.exit(1);

  } finally {
    // Ensure clean disconnect
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected cleanly.');
  }
}

// Run the seed function
seed();
