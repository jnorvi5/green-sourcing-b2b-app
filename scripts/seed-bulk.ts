import { faker } from '@faker-js/faker';
import dbConnect from '../lib/mongodb';
import Product from '../models/Product';

interface GreenData {
  gwp: number; // kg CO2e per functional unit (m2 or kg)
  recycledContent?: string; // e.g., "85%"
  embodiedCarbon?: number;
  epdCertified: boolean;
  certifications?: string[];
}

async function main() {
  await dbConnect();

  console.log('Clearing Product collection...');
  await Product.deleteMany({});

  const categories = {
    Structural: [
      'Mass Timber',
      'Cross-Laminated Timber (CLT)',
      'Green Concrete',
      'Low-Carbon Concrete',
      'Recycled Steel',
      'High-Recycled Steel'
    ],
    Envelope: [
      'Smart Glass',
      'Electrochromic Glass',
      'Hempcrete Insulation',
      'Natural Fiber Insulation',
      'Mycelium Panels',
      'Aerogel Composite Panels'
    ],
    Finishes: [
      'Recycled Ocean Plastic Tiles',
      'Low-VOC Paints',
      'Bamboo Flooring',
      'Cork Flooring',
      'Linoleum (Natural)',
      'Reclaimed Wood Cladding'
    ]
  };

  const unsplashKeywords = {
    'Mass Timber': 'timber,construction',
    'Cross-Laminated Timber (CLT)': 'wood,construction',
    'Green Concrete': 'concrete,construction',
    'Low-Carbon Concrete': 'concrete,eco',
    'Recycled Steel': 'steel,construction',
    'High-Recycled Steel': 'steel,recycled',
    'Smart Glass': 'glass,building',
    'Electrochromic Glass': 'smart-glass,window',
    'Hempcrete Insulation': 'hempcrete,insulation',
    'Natural Fiber Insulation': 'natural-fiber,insulation',
    'Mycelium Panels': 'mycelium,biotech',
    'Aerogel Composite Panels': 'aerogel,insulation',
    'Recycled Ocean Plastic Tiles': 'ocean,plastic,recycled',
    'Low-VOC Paints': 'paint,eco',
    'Bamboo Flooring': 'bamboo,flooring',
    'Cork Flooring': 'cork,floor',
    'Linoleum (Natural)': 'linoleum,natural',
    'Reclaimed Wood Cladding': 'wood,reclaimed'
  };

  const certificationsPool = ['EPD', 'Cradle to Cradle', 'LEED', 'BREEAM', 'Declare', 'FSC', 'GreenGuard'];

  const products = [] as any[];
  const total = 60;
  const categoryKeys = Object.keys(categories);

  for (let i = 0; i < total; i++) {
    // Pick category and subcategory
    const category = faker.helpers.arrayElement(categoryKeys);
    const subcategory = faker.helpers.arrayElement(categories[category as keyof typeof categories]);

    const adjective = faker.commerce.productAdjective();
    const materialDescriptor = subcategory;

    const title = `${adjective} ${materialDescriptor}`;
    const description = `${faker.lorem.paragraphs(2)}\n\nMaterial overview: ${faker.lorem.sentence()}`;

    // Green data (credible variety)
    const gwp = Number((faker.number.float({ min: -8, max: 120, fractionDigits: 1 })).toFixed(1));
    const recycledContentPercent = faker.helpers.arrayElement([0, 5, 15, 30, 45, 60, 75, 85, 95]);
    const embodiedCarbon = Number((faker.number.float({ min: 0.5, max: 300, fractionDigits: 1 })).toFixed(1));
    const epdCertified = faker.datatype.boolean();

    const certs = faker.helpers.arrayElements(certificationsPool, faker.number.int({ min: 0, max: 3 }));

    const greenData = {
      gwp,
      recycledContent: recycledContentPercent > 0 ? `${recycledContentPercent}%` : '0%',
      embodiedCarbon,
      epdCertified,
      certifications: certs
    } as GreenData;

    // Autodesk placeholder
    const autodeskData = {
      materialId: faker.string.uuid()
    };

    // Images using Unsplash source query (keyword-based)
    const keyword = unsplashKeywords[subcategory] || 'building,material,construction';
    const images = [
      `https://source.unsplash.com/featured/?${encodeURIComponent(keyword)}&w=1200&h=800`,
      `https://source.unsplash.com/featured/?${encodeURIComponent(keyword)},industry&w=1200&h=800`
    ];

    const price = Number(faker.commerce.price({ min: 10, max: 5000, dec: 2 }));
    const sku = `PRD-${faker.string.hexadecimal({ length: 8, prefix: '' }).toUpperCase()}`;

    const technicalProperties = {
      density: `${faker.number.int({ min: 10, max: 2200 })} kg/m3`,
      thermalConductivity: `${(faker.number.float({ min: 0.02, max: 2, fractionDigits: 2 })).toFixed(2)} W/mK`,
      fireRating: faker.helpers.arrayElement(['A1', 'A2', 'B', 'C']),
      serviceLife: `${faker.number.int({ min: 10, max: 100 })} years`
    };

    products.push({
      title,
      description,
      category,
      subcategory,
      greenData,
      autodeskData,
      images,
      price,
      sku,
      technicalProperties,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        visibility: 'public',
        featured: i < 6
      }
    });
  }

  console.log(`Inserting ${products.length} products...`);
  await Product.insertMany(products);

  console.log(`Created ${products.length} products and inserted into DB`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
