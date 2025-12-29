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

  async fetchEPDs(options?: { page?: number; perPage?: number }): Promise<{ data: EPDData[]; meta?: Record<string, unknown> }> {
    if (!this.apiKey) {
      console.warn("⚠️ EPD API Key missing. Returning empty results.");
      return { data: [], meta: { total: 0 } };
    }

    try {
      const page = options?.page || 1;
      const perPage = options?.perPage || 50;
      
      const response = await fetch(
        `https://api.environdec.com/api/v1/epds?page=${page}&per_page=${perPage}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EPD API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Handle both {data: [...]} and direct array responses
      if (Array.isArray(result)) {
        return { data: result as EPDData[] };
      }
      
      return result as { data: EPDData[]; meta?: Record<string, unknown> };
    } catch (error) {
      console.error("EPD Fetch Failed:", error);
      throw error;
    }
  }

  async fetchAllEPDs(options?: { limit?: number; perPage?: number }): Promise<EPDData[]> {
    const allData: EPDData[] = [];
    let page = 1;
    const perPage = options?.perPage || 50;
    const limit = options?.limit;

    while (true) {
      const result = await this.fetchEPDs({ page, perPage });
      allData.push(...result.data);

      // Stop if we've hit the limit
      if (limit && allData.length >= limit) {
        return allData.slice(0, limit);
      }

      // Stop if no data returned
      if (!result.data.length) {
        break;
      }

      // Stop if we got less than a full page (indicates last page)
      if (result.data.length < perPage) {
        break;
      }

      // Stop if meta indicates we're on the last page
      const totalPages = result.meta?.totalPages as number | undefined;
      if (totalPages && page >= totalPages) {
        break;
      }

      page++;
    }

    return allData;
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
export function normalizeEPD(rawEPD: Record<string, unknown>): EPDData | null {
  // Extract required fields - try multiple field name variations
  const epdNumber = String(
    rawEPD['epd_number'] || 
    rawEPD['registration_number'] || 
    rawEPD['registrationNumber'] || 
    rawEPD['uuid'] || 
    rawEPD['id'] || 
    ''
  );
  const productName = String(
    rawEPD['product_name'] || 
    rawEPD['productName'] || 
    rawEPD['name'] || 
    ''
  );
  const validFrom = rawEPD['valid_from'] || rawEPD['validFrom'];
  const validUntil = rawEPD['valid_until'] || rawEPD['validUntil'];

  // Validate required fields
  if (!epdNumber || !productName || !validFrom || !validUntil) {
    return null;
  }

  // Extract manufacturer
  let manufacturer = '';
  if (typeof rawEPD['manufacturer'] === 'string') {
    manufacturer = rawEPD['manufacturer'];
  } else if (typeof rawEPD['manufacturer'] === 'object' && rawEPD['manufacturer'] !== null) {
    manufacturer = String((rawEPD['manufacturer'] as Record<string, unknown>)['name'] || '');
  }

  // Extract GWP from various formats
  let gwp: number | null = null;
  if (typeof rawEPD['gwp_fossil_a1a3'] === 'number') {
    gwp = rawEPD['gwp_fossil_a1a3'];
  } else if (typeof rawEPD['gwpA1A3'] === 'number') {
    gwp = rawEPD['gwpA1A3'];
  } else if (rawEPD['impacts'] && typeof rawEPD['impacts'] === 'object') {
    const impacts = rawEPD['impacts'] as Record<string, unknown>;
    if (impacts['gwp'] && typeof impacts['gwp'] === 'object') {
      const gwpData = impacts['gwp'] as Record<string, unknown>;
      if (typeof gwpData['a1a3'] === 'number') {
        gwp = gwpData['a1a3'];
      }
    }
  }

  // Extract certifications
  const certifications: string[] = [];
  if (Array.isArray(rawEPD['certifications'])) {
    for (const cert of rawEPD['certifications']) {
      if (typeof cert === 'string') {
        certifications.push(cert);
      } else if (typeof cert === 'object' && cert !== null) {
        const certName = (cert as Record<string, unknown>)['name'];
        if (typeof certName === 'string') {
          certifications.push(certName);
        }
      }
    }
  }

  // Extract geographic scope
  let geographicScope: string[] = [];
  if (Array.isArray(rawEPD['geographic_scope'])) {
    geographicScope = rawEPD['geographic_scope'].filter((s): s is string => typeof s === 'string');
  } else if (typeof rawEPD['geographic_scope'] === 'string') {
    geographicScope = [rawEPD['geographic_scope']];
  }

  return {
    id: epdNumber,
    epd_number: epdNumber,
    product_name: productName,
    name: productName,
    manufacturer: manufacturer || undefined,
    gwp_fossil_a1a3: gwp,
    gwp,
    recycled_content_pct: typeof rawEPD['recycled_content_pct'] === 'number' ? rawEPD['recycled_content_pct'] : null,
    declared_unit: rawEPD['declared_unit'] as string | undefined || rawEPD['declaredUnit'] as string | undefined || null,
    pcr_reference: rawEPD['pcr_reference'] as string | undefined || null,
    valid_until: String(validUntil),
    valid_from: String(validFrom),
    registration_number: epdNumber,
    pcr: rawEPD['pcr'] as string | undefined,
    certifications,
    geographic_scope: geographicScope,
    data_source: 'EPD International',
  } as EPDData;
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
