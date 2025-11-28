import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define Product Schema inline to avoid dependency issues
const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  supplierId: { type: String, required: true, index: true },
  images: [String],
  greenData: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  autodeskData: { materialId: String, gwp: Number, lastSynced: Date },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🧹 Cleared existing inventory');

    const products = [];
    const categories = ['Structural', 'Envelope', 'Finishes', 'Insulation'];

    console.log('🏭 Generating 50 Enterprise Products...');

    for (let i = 0; i < 50; i++) {
      const category = faker.helpers.arrayElement(categories);
      
      products.push({
        title: `${faker.commerce.productAdjective()} ${category} Material`,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 100, max: 5000 })),
        supplierId: 'seed-supplier-01',
        images: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"],
        greenData: {
          gwp: faker.number.float({ min: -50, max: 10, fractionDigits: 1 }),
          recycledContent: `${faker.number.int({ min: 10, max: 100 })}%`,
          certification: faker.helpers.arrayElement(['LEED', 'BREEAM', 'Living Building Challenge']),
          source: 'Autodesk'
        },
        autodeskData: {
          materialId: `mat-${faker.string.uuid()}`,
          gwp: faker.number.float({ min: -50, max: 10, fractionDigits: 1 }),
          lastSynced: new Date()
        }
      });
    }

    await Product.insertMany(products);
    console.log('🚀 Successfully seeded 50 products!');
    console.log('✅ Inventory Loaded');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
