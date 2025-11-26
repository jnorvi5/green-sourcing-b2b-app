import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  supplierId: { type: String, required: true, index: true }, // Supabase User ID
  images: [String], // Array of S3 URLs
  
  // The "Green Data" Block
  greenData: {
    type: Map,
    of: Schema.Types.Mixed, // Flexible JSON for EPD data
    default: {}
  },
  
  // The Autodesk Link
  autodeskData: {
    materialId: String,
    gwp: Number,
    lastSynced: Date
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Singleton Model (Prevents "OverwiteModelError" in Next.js hot reload)
const Product = models.Product || model('Product', ProductSchema);

export default Product;
