import { faker } from '@faker-js/faker';
import dbConnect from '../lib/mongodb';
import Product from '../models/Product';

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

  const certificationsPool = ['EPD', 'Cradle to Cradle', 'LEED', 'BREEAM', 'Declare', 'FSC', 'GreenGuard'];
  const lifecycleStages = ['A1-A3 (Product)', 'A4-A5 (Construction)', 'B1-B7 (Use)', 'C1-C4 (End of Life)', 'D (Benefits)'];
  const unitsOfMeasure = ['m2', 'kg', 'm3', 'unit', 'liter', 'ton'];
  const currencies: Array<'USD' | 'EUR' | 'GBP' | 'CAD'> = ['USD', 'EUR', 'GBP', 'CAD'];
  const statusOptions: Array<'draft' | 'active' | 'archived'> = ['draft', 'active', 'archived'];

  // Generate sample supplier IDs
  const supplierIds = Array.from({ length: 10 }, () => faker.string.uuid());

  const products: Array<Record<string, unknown>> = [];
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

    // Green data matching IGreenData interface
    const recycledContent = faker.helpers.arrayElement([0, 5, 15, 30, 45, 60, 75, 85, 95]);
    const hasEpd = faker.datatype.boolean();
    const certifications = faker.helpers.arrayElements(certificationsPool, faker.number.int({ min: 0, max: 3 }));

    const greenData = {
      epdId: hasEpd ? `EPD-${faker.string.alphanumeric(10).toUpperCase()}` : undefined,
      carbonFootprint: parseFloat(faker.number.float({ min: 0.5, max: 120, fractionDigits: 1 }).toFixed(1)),
      recycledContent,
      renewableEnergy: faker.number.int({ min: 0, max: 100 }),
      waterUsage: parseFloat(faker.number.float({ min: 0.1, max: 500, fractionDigits: 1 }).toFixed(1)),
      certifications,
      lifecycleStage: faker.helpers.arrayElement(lifecycleStages),
    };

    // Images using picsum.photos (reliable placeholder service)
    // Each product gets a unique image based on index
    const imageId1 = (i * 2) + 100;
    const imageId2 = (i * 2) + 101;
    const images = [
      `https://picsum.photos/seed/${imageId1}/1200/800`,
      `https://picsum.photos/seed/${imageId2}/1200/800`
    ];

    const price = parseFloat(faker.commerce.price({ min: 10, max: 5000, dec: 2 }));

    // Generate tags based on category and subcategory
    const baseTags = [category.toLowerCase(), subcategory.toLowerCase().replace(/[()]/g, ''), 'sustainable', 'green'];
    const additionalTags = faker.helpers.arrayElements(['eco-friendly', 'low-carbon', 'recyclable', 'renewable', 'bio-based', 'non-toxic'], faker.number.int({ min: 1, max: 3 }));
    const tags = [...new Set([...baseTags, ...additionalTags])];

    products.push({
      title,
      description,
      price,
      currency: faker.helpers.arrayElement(currencies),
      supplierId: faker.helpers.arrayElement(supplierIds),
      supplierName: faker.company.name(),
      category,
      subcategory,
      images,
      certificates: certifications, // Reuse certifications for certificates field
      status: i < 50 ? 'active' : faker.helpers.arrayElement(statusOptions), // First 50 are active
      minOrderQuantity: faker.number.int({ min: 1, max: 100 }),
      unitOfMeasure: faker.helpers.arrayElement(unitsOfMeasure),
      leadTimeDays: faker.number.int({ min: 3, max: 45 }),
      tags,
      greenData,
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
