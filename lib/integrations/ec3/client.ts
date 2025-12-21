/**
 * EC3 (Building Transparency) API Integration
 * 
 * Client for searching materials and retrieving EPDs from the EC3 database.
 * Requires EC3_CLIENT_ID and EC3_CLIENT_SECRET environment variables.
 */

export const EC3_API_BASE = 'https://buildingtransparency.org/api';

interface EC3Token {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get valid access token for EC3 API
 */
export async function getAccessToken(): Promise<string | null> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env['EC3_CLIENT_ID'];
  const clientSecret = process.env['EC3_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    console.warn('EC3 credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`${EC3_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=read'
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`);
    }

    const data: EC3Token = await response.json();
    cachedToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry to be safe
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 300000;
    
    return cachedToken;
  } catch (error) {
    console.error('Error getting EC3 token:', error);
    return null;
  }
}

export interface EC3Material {
  id: string;
  name: string;
  description: string;
  category: string;
  gwp: {
    value: number;
    unit: string;
  };
  manufacturer: {
    name: string;
    country: string;
  };
  epd_url?: string;
}

/**
 * Search for materials in EC3
 */
export async function searchEC3Materials(
  query: string, 
  limit: number = 5
): Promise<EC3Material[]> {
  const token = await getAccessToken();

  // Return mock data if credentials are missing
  if (!token) {
    console.log('[EC3] Using mock data');
    return getMockMaterials(query, limit);
  }

  try {
    // Note: This is a simplified search endpoint. Real EC3 API has complex filtering.
    // Using the /materials endpoint with name filter
    const response = await fetch(
      `${EC3_API_BASE}/materials?name__like=${encodeURIComponent(query)}&page_size=${limit}&fields=id,name,description,category,gwp,manufacturer,epd_url`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error(`EC3 search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Map response to simplified structure
    // Note: Adjust mapping based on actual EC3 API response structure
    return (data.results || []).map((item: Record<string, unknown>) => {
      const category = item['category'] as Record<string, unknown> | undefined;
      const gwp = item['gwp'] as Record<string, unknown> | undefined;
      const manufacturer = item['manufacturer'] as Record<string, unknown> | undefined;
      const address = manufacturer?.['address'] as Record<string, unknown> | undefined;
      
      return {
        id: item['id'],
        name: item['name'],
        description: item['description'] || '',
        category: (category?.['name'] as string) || 'Unknown',
        gwp: {
          value: (gwp?.['value'] as number) || 0,
          unit: (gwp?.['unit'] as string) || 'kgCO2e'
        },
        manufacturer: {
          name: (manufacturer?.['name'] as string) || 'Unknown',
          country: (address?.['country'] as string) || 'Unknown'
        },
        epd_url: item['epd_url']
      };
    });

  } catch (error) {
    console.error('Error searching EC3:', error);
    return [];
  }
}

function getMockMaterials(query: string, limit: number): EC3Material[] {
  const mockDb: EC3Material[] = [
    {
      id: 'ec3-1',
      name: 'Low Carbon Concrete 3000psi',
      description: 'High fly ash content concrete',
      category: 'Concrete',
      gwp: { value: 180, unit: 'kgCO2e' },
      manufacturer: { name: 'EcoMix', country: 'USA' }
    },
    {
      id: 'ec3-2',
      name: 'Recycled Steel Rebar',
      description: '90% recycled content',
      category: 'Steel',
      gwp: { value: 450, unit: 'kgCO2e' },
      manufacturer: { name: 'GreenSteel Inc', country: 'USA' }
    },
    {
      id: 'ec3-3',
      name: 'FSC Birch Plywood',
      description: 'Sustainably sourced plywood',
      category: 'Wood',
      gwp: { value: 95, unit: 'kgCO2e' },
      manufacturer: { name: 'Nordic Wood', country: 'Sweden' }
    }
  ];

  return mockDb
    .filter(m =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.category.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, limit);
}
