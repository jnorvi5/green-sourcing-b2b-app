
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';

dotenv.config(); // Load env vars

// Helper to handle potential schema differences or missing types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type anyType = any;

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || '';
// We will read the key from a file to avoid environment variable mangling issues
let supabaseServiceKey = '';

// Try reading from file first if available (I will create this file in the environment)
try {
  if (existsSync('scripts/key.txt')) {
     supabaseServiceKey = readFileSync('scripts/key.txt', 'utf8').trim();
  }
} catch (e) {
  // ignore
}

// Fallback to env
if (!supabaseServiceKey) {
    supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEYQ'] || '';
    if (supabaseServiceKey.startsWith('=')) {
        supabaseServiceKey = supabaseServiceKey.substring(1);
    }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key.');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
// console.log('Using Service Key (first 10 chars):', supabaseServiceKey.substring(0, 10));

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  const filePath = path.join(process.cwd(), 'supplier_products.json');
  console.log(`Reading data from ${filePath}...`);

  let rawData;
  try {
    rawData = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error('Could not read supplier_products.json. Run the scraper first.');
    process.exit(1);
  }

  const suppliers: anyType[] = JSON.parse(rawData);
  console.log(`Found ${suppliers.length} suppliers to import.`);

  for (const supplier of suppliers) {
    console.log(`Importing supplier: ${supplier.name}`);

    // Check if supplier already exists by name to avoid duplicates
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', supplier.name)
      .single();

    let supplierId;

    if (existing) {
      console.log(`  Supplier exists (ID: ${existing.id}), skipping creation.`);
      supplierId = existing.id;
    } else {
      // Insert Supplier
      const { data: newSupplier, error: supError } = await supabase
        .from('suppliers')
        .insert({
          name: supplier.name,
          website: supplier.website,
          description: supplier.description,
          location: supplier.location,
          logo_url: supplier.logo_url,
          verification_status: 'pending',
          tier: 'free'
        })
        .select()
        .single();

      if (supError) {
        console.error(`  Error creating supplier ${supplier.name}:`, supError.message);
        continue;
      }
      supplierId = newSupplier.id;
      console.log(`  Created supplier ID: ${supplierId}`);
    }

    // Insert Products
    if (supplier.products && supplier.products.length > 0) {
      console.log(`  Importing ${supplier.products.length} products...`);

      const productsToInsert = supplier.products.map((p: anyType) => ({
        supplier_id: supplierId,
        name: p.name,
        description: p.description,
        material_type: p.material_type,
        application: p.application,
        certifications: p.certifications,
        sustainability_data: p.sustainability_data,
        specifications: p.specifications,
        images: p.images,
        epd_pdf_url: p.epd_pdf_url,
        verified: false
      }));

      // Insert in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        const { error: prodError } = await supabase
          .from('products')
          .insert(batch);

        if (prodError) {
          console.error(`  Error importing batch ${i/BATCH_SIZE + 1}:`, prodError.message);
        }
      }
      console.log(`  Products imported.`);
    }
  }

  console.log('Seeding complete.');
}

seedData().catch(console.error);
