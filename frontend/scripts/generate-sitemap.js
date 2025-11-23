// scripts/generate-sitemap.js
// Generates sitemap.xml with static and dynamic routes from Supabase

import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SITE_URL = process.env.VITE_SITE_URL || 'https://greenchainz.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Static routes with priorities and change frequencies
const staticRoutes = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/login', changefreq: 'monthly', priority: 0.5 },
  { url: '/signup', changefreq: 'monthly', priority: 0.5 },
  { url: '/search', changefreq: 'daily', priority: 0.9 },
  { url: '/features', changefreq: 'weekly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.3 },
];

async function generateSitemap() {
  try {
    console.log('🚀 Starting sitemap generation...\n');

    // Fetch all product IDs from Supabase
    console.log('📦 Fetching products from Supabase...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error.message);
      throw error;
    }

    console.log(`✅ Found ${products?.length || 0} products\n`);

    // Create sitemap stream
    const sitemap = new SitemapStream({ hostname: SITE_URL });
    const outputPath = join(__dirname, '..', 'dist', 'sitemap.xml');
    const writeStream = createWriteStream(outputPath);

    sitemap.pipe(writeStream);

    // Add static routes
    console.log('📝 Adding static routes...');
    staticRoutes.forEach((route) => {
      sitemap.write({
        url: route.url,
        changefreq: route.changefreq,
        priority: route.priority,
      });
      console.log(`   ✓ ${route.url}`);
    });

    // Add dynamic product routes
    if (products && products.length > 0) {
      console.log('\n📝 Adding product routes...');
      products.forEach((product) => {
        sitemap.write({
          url: `/product/${product.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: product.updated_at || new Date().toISOString(),
        });
      });
      console.log(`   ✓ Added ${products.length} product pages`);
    }

    // Finalize sitemap
    sitemap.end();

    // Wait for file to be written
    await streamToPromise(sitemap);

    console.log('\n✨ Sitemap generated successfully!');
    console.log(`📄 Location: ${outputPath}`);
    console.log(`🌐 Site URL: ${SITE_URL}`);
    console.log(`📊 Total URLs: ${staticRoutes.length + (products?.length || 0)}\n`);
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();
