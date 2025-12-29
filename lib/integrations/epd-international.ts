// EPD Data Interface
export interface EPDData {
  id: string;
  name: string;
  manufacturer?: string;
  gwp?: number;
  declared_unit?: string;
  valid_until?: string;
  registration_number?: string;
  pcr?: string;
  [key: string]: unknown;
}

// EPD International API Client Class
export class EPDInternationalClient {
  private apiKey: string | undefined;

  constructor(config?: { apiKey?: string }) {
    this.apiKey = config?.apiKey || process.env['EPD_INTERNATIONAL_API_KEY'];
  }

  async search(query: string): Promise<{ data: EPDData[]; meta?: Record<string, unknown> }> {
    return await searchEPDs(query);
  }

  async getById(id: string): Promise<EPDData | null> {
    if (!this.apiKey) {
      console.warn("⚠️ EPD API Key missing. Returning null.");
      return null;
    }

    try {
      const response = await fetch(`https://api.environdec.com/api/v1/epd/${id}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      if (!response.ok) {
        throw new Error(`EPD API Error: ${response.status}`);
      }

      const data = await response.json();
      return data as EPDData;
    } catch (error) {
      console.error("EPD Fetch Failed:", error);
      return null;
    }
  }
}

// Normalize EPD data from various sources
export function normalizeEPD(rawEPD: Record<string, unknown>): EPDData {
  return {
    id: String(rawEPD['id'] || rawEPD['uuid'] || rawEPD['_id'] || ''),
    name: String(rawEPD['name'] || rawEPD['product_name'] || rawEPD['productName'] || 'Unknown'),
    manufacturer: rawEPD['manufacturer'] as string | undefined,
    gwp: typeof rawEPD['gwp'] === 'number' ? rawEPD['gwp'] : undefined,
    declared_unit: rawEPD['declared_unit'] as string | undefined || rawEPD['declaredUnit'] as string | undefined,
    valid_until: rawEPD['valid_until'] as string | undefined || rawEPD['validUntil'] as string | undefined,
    registration_number: rawEPD['registration_number'] as string | undefined || rawEPD['registrationNumber'] as string | undefined,
    pcr: rawEPD['pcr'] as string | undefined,
    ...rawEPD,
  };
}

// Search EPDs by query
export async function searchEPDs(query: string): Promise<{ data: EPDData[]; meta?: Record<string, unknown> }> {
  const apiKey = process.env['EPD_INTERNATIONAL_API_KEY'];

  // 1. Safety Check: If no key, return empty list (Don't crash)
  if (!apiKey) {
    console.warn("⚠️ EPD API Key missing. Returning mock results.");
    return {
      data: [],
      meta: { total: 0, note: "Mock mode - Key missing" }
    };
  }

  try {
    const response = await fetch(`https://api.environdec.com/api/v1/epd?q=${query}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`EPD API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("EPD Fetch Failed:", error);
    // Return empty list on error (Prevent app crash)
    return { data: [] };
  }
}
