
import { getAccessToken, EC3_API_BASE } from '../lib/integrations/ec3/client';
import { Product } from '../types/product';
import * as fs from 'fs';
import * as path from 'path';

// Define the EC3 raw response interface (based on client.ts usage and expectation)
interface EC3RawMaterial {
  id: string;
  name: string;
  description: string;
  category: { name: string } | string; // Could be object or string based on API
  gwp?: {
    value: number;
    unit: string;
  };
  manufacturer?: {
    name: string;
    address?: {
      country?: string;
    };
  };
  epd_url?: string;
  // Add other fields as needed
  [key: string]: any;
}

const ERROR_LOG_PATH = path.join(process.cwd(), 'errors.log');

function logError(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
  fs.appendFileSync(ERROR_LOG_PATH, logEntry);
}

// Function to generate a deterministic (or random) UUID for supplier if we don't have one
// For this script, we'll use a placeholder UUID since we don't have a supplier DB lookup here.
// In a real scenario, we would lookup the supplier by name or create one.
const PLACEHOLDER_SUPPLIER_ID = '00000000-0000-0000-0000-000000000000';

async function fetchConcreteData() {
  console.log('Starting EC3 Concrete Ingestion...');

  const token = await getAccessToken();
  if (!token) {
    console.error('Failed to authenticate with EC3.');
    logError('Failed to authenticate with EC3 - check credentials.');
    return;
  }

  try {
    // Query parameters:
    // Filter for "Concrete" category.
    // Filter for "USA" jurisdiction.
    // Note: The specific filter syntax depends on EC3 API version.
    // Based on common patterns: `category=Concrete` and `jurisdiction=US` or `address_country=US`.
    // Since client.ts uses `name__like`, we will use `category` and filtering.
    // We will request 100 items for this script.

    // Attempting to filter by category and country in the query if possible,
    // but relying on client-side filtering if API returns broader results.
    // 'jurisdiction' or 'geography' are common filters in EC3. Let's try `jurisdiction=US`.

    const params = new URLSearchParams({
      'category__name__like': 'Concrete', // Guessing filter, or just fetch large set and filter
      'page_size': '50',
      'fields': 'id,name,description,category,gwp,manufacturer,epd_url,specifications'
    });

    // Note: If the API doesn't support 'category__name__like', we might get everything.
    // We'll filter in code to be safe.

    const url = `${EC3_API_BASE}/materials?${params.toString()}`;
    console.log(`Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API Request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results: EC3RawMaterial[] = data.results || [];

    console.log(`Received ${results.length} records. Processing...`);

    const mappedProducts: Product[] = [];

    for (const item of results) {
      try {
        // Validation / Filtering

        // 1. Filter for Concrete (if API didn't strictly enforce)
        const categoryName = typeof item.category === 'object' ? item.category?.name : item.category;
        if (!categoryName?.toLowerCase().includes('concrete')) {
            // logError('Skipping non-concrete item', { id: item.id, category: categoryName });
            continue;
        }

        // 2. Filter for USA
        // Check manufacturer address
        const country = item.manufacturer?.address?.country;
        // Also check declared unit or jurisdiction if available, but manufacturer address is a good proxy
        // If country is undefined, we might skip or include. Requirement says "filtering for ... USA".
        // Let's be strict.
        if (country !== 'USA' && country !== 'US' && country !== 'United States') {
           // logError('Skipping non-USA item', { id: item.id, country });
           continue;
        }

        // Map to Product
        const product: Product = {
          id: item.id, // Using EC3 ID might not be a valid UUID.
                       // Product interface defines id as string, but DB usually expects UUID.
                       // If `item.id` is not UUID, we might need to generate one.
                       // EC3 IDs are often UUIDs. If not, we should probably hash it or generate new.
                       // For safety, let's assume it's a string ID that fits.
                       // If the DB requires UUID, this script might fail at DB insert,
                       // but the task is just to create the script and map to interface.
          supplier_id: PLACEHOLDER_SUPPLIER_ID, // Needs real resolution logic in production
          name: item.name,
          description: item.description || null,
          material_type: 'Concrete', // Normalized
          application: null, // Not provided by EC3 easily
          certifications: null, // Could extract from other fields if available
          sustainability_data: {
            gwp: item.gwp?.value,
            recycled_content: undefined // EC3 might have this in specs, but not standard top-level
          },
          specs: item['specifications'] || {}, // Store extra data
          images: null, // EC3 might provide images, but we requested specific fields
          epd_url: item.epd_url || null,
          verified: true, // Assuming EC3 data is verified source
        };

        // Basic validation of mapped product
        if (!product.name) {
          throw new Error('Missing product name');
        }

        mappedProducts.push(product);

      } catch (mapError) {
        logError(`Mapping error for item ${item.id}`, mapError);
      }
    }

    console.log(`Successfully mapped ${mappedProducts.length} products.`);

    // Output mapped products (in a real script, this would upsert to DB)
    // For now, we'll just log one example to console
    if (mappedProducts.length > 0) {
        console.log('Sample mapped product:', JSON.stringify(mappedProducts[0], null, 2));
    }

  } catch (error) {
    console.error('Ingestion failed:', error);
    logError('Ingestion process failed', error);
  }
}

// Run if called directly
if (require.main === module) {
  fetchConcreteData();
}

export { fetchConcreteData };
