
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  await client.connect();

  try {
    // Add a transaction to truncate tables before seeding
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE products, suppliers CASCADE');

    // Create a dummy supplier
    const supplierResult = await client.query(
      `INSERT INTO suppliers (name, description, location, logo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        faker.company.name(),
        faker.company.catchPhrase(),
        faker.location.city(),
        faker.image.url(),
      ]
    );
    const supplierId = supplierResult.rows[0].id;
    console.log(`Created supplier with id: ${supplierId}`);

    // Generate 20 dummy products data
    const PRODUCT_COLUMNS = 11; // Number of columns in the products table
    const productValues: unknown[][] = [];
    for (let i = 0; i < 20; i++) {
      productValues.push([
        supplierId,
        `Sustainable Insulation ${i + 1}`,
        faker.commerce.productDescription(),
        'Insulation',
        'Roofing',
        ['LEED', 'FSC'],
        JSON.stringify({
          gwp: faker.number.float({ min: 1, max: 10, multipleOf: 0.01 }),
          recycled_content_percent: faker.number.int({ min: 10, max: 90 }),
        }),
        JSON.stringify({
          r_value: faker.number.float({ min: 2, max: 7, multipleOf: 0.1 }),
          fire_rating: 'Class A',
        }),
        [faker.image.url(), faker.image.url()],
        faker.internet.url(),
        faker.datatype.boolean(),
      ]);
    }

    // Insert all products in a single batch query for better performance
    const placeholders = productValues.map((_, idx) => {
      const baseIdx = idx * PRODUCT_COLUMNS;
      return `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, $${baseIdx + 11})`;
    }).join(', ');

    const flatValues = productValues.flat();

    await client.query(
      `INSERT INTO products (supplier_id, name, description, material_type, application, certifications, sustainability_data, specs, images, epd_url, verified)
       VALUES ${placeholders}`,
      flatValues
    );

    await client.query('COMMIT');
    console.log('Successfully seeded 20 dummy products.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

export { seed };

// This allows running the script directly via `tsx supabase/seed.ts`
// This allows running the script directly via `tsx supabase/seed.ts`
// Using a robust check for main module execution
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed();
}
