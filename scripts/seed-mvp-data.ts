
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate mock data for MVP testing
 * Saves to JSON files that frontend can use
 */

interface Supplier {
  id: string;
  name: string;
  website: string;
  tier: 'free' | 'standard' | 'verified';
  is_founding_50: boolean;
}

interface Architect {
  id: string;
  email: string;
  company_name: string;
  trust_score: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  supplier_id: string;
  price: number;
  carbon_footprint: number;
}

function generateMockData() {
  console.log('🌱 Generating mock MVP data...');

  // Create output directory
  const dataDir = path.join(process.cwd(), 'public', 'mock-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Generate 100 suppliers
  const suppliers: Supplier[] = [];
  for (let i = 1; i <= 100; i++) {
    suppliers.push({
      id: `sup_${i}`,
      name: `Green Supplier ${i}`,
      website: `https://supplier${i}.example.com`,
      tier: i <= 10 ? 'verified' : (i <= 50 ? 'standard' : 'free'),
      is_founding_50: i <= 50,
    });
  }

  fs.writeFileSync(
    path.join(dataDir, 'suppliers.json'),
    JSON.stringify(suppliers, null, 2)
  );
  console.log(`✅ Generated ${suppliers.length} suppliers`);

  // 2. Generate 50 architects
  const architects: Architect[] = [];
  for (let i = 1; i <= 50; i++) {
    architects.push({
      id: `arch_${i}`,
      email: `architect${i}@test.greenchainz.com`,
      company_name: `Architecture Firm ${i}`,
      trust_score: 50 + Math.floor(Math.random() * 50),
    });
  }

  fs.writeFileSync(
    path.join(dataDir, 'architects.json'),
    JSON.stringify(architects, null, 2)
  );
  console.log(`✅ Generated ${architects.length} architects`);

  // 3. Generate 100 products
  const products: Product[] = [];
  const materials = [
    'Recycled Steel Beam',
    'Low Carbon Concrete',
    'FSC Oak Flooring',
    'Cork Insulation',
    'Bamboo Panels',
  ];

  for (let i = 1; i <= 100; i++) {
    const supplierId = suppliers[i % suppliers.length].id;
    const material = materials[i % materials.length];

    products.push({
      id: `prod_${i}`,
      name: `${material} - Model ${i}`,
      category: 'Structural',
      supplier_id: supplierId,
      price: 50 + Math.random() * 500,
      carbon_footprint: 100 + Math.random() * 400,
    });
  }

  fs.writeFileSync(
    path.join(dataDir, 'products.json'),
    JSON.stringify(products, null, 2)
  );
  console.log(`✅ Generated ${products.length} products`);

  // 4. Generate summary report
  const report = `
# Mock Data Generation Report

**Generated:** ${new Date().toISOString()}

## Summary

- **Suppliers:** ${suppliers.length}
  - Verified: ${suppliers.filter(s => s.tier === 'verified').length}
  - Standard: ${suppliers.filter(s => s.tier === 'standard').length}
  - Free: ${suppliers.filter(s => s.tier === 'free').length}
  - Founding 50: ${suppliers.filter(s => s.is_founding_50).length}

- **Architects:** ${architects.length}
  - Average trust score: ${(architects.reduce((sum, a) => sum + a.trust_score, 0) / architects.length).toFixed(1)}

- **Products:** ${products.length}
  - Average price: $${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}
  - Average carbon: ${(products.reduce((sum, p) => sum + p.carbon_footprint, 0) / products.length).toFixed(0)} kg CO2e

## Files Generated

- \`public/mock-data/suppliers.json\`
- \`public/mock-data/architects.json\`
- \`public/mock-data/products.json\`

## Usage

Frontend can load this data with:

\`\`\`typescript
const suppliers = await fetch('/mock-data/suppliers.json').then(r => r.json());
\`\`\`

This allows frontend development to proceed without database access.

## Next Steps

When database credentials are resolved:
1. Run \`scripts/seed-database.ts\` to insert into Supabase
2. Update frontend to use Supabase instead of mock data
3. Delete \`public/mock-data/\` directory
`;

  fs.writeFileSync(
    path.join(dataDir, 'README.md'),
    report
  );

  console.log('\n🎉 Mock data generation complete!');
  console.log(`📁 Files saved to: ${dataDir}`);
  console.log('\nFrontend can now use /mock-data/*.json for development');
}

// Run
generateMockData();
