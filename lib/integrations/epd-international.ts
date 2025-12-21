/**
 * EPD International API Client
 * 
 * Handles communication with EPD International API at https://epd-apim.developer.azure-api.net
 * Supports both ILCD/EPD XML and JSON response formats with automatic parsing and normalization.
 */

import { epdApiResponseSchema, type EPDApiResponse, type NormalizedEPD } from '@/lib/validations/epd-sync';

interface EPDInternationalClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface FetchEPDsOptions {
  page?: number;
  perPage?: number;
  limit?: number; // For testing: cap total fetches
  search?: string;
  manufacturer?: string;
}

interface PaginatedResponse {
  data: EPDApiResponse[];
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    totalPages?: number;
  };
}

/**
 * Client for EPD International API
 */
export class EPDInternationalClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: EPDInternationalClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://epd-apim.developer.azure-api.net/api';
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Make an authenticated request to the EPD International API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Mock mode for testing without valid API key
    if (this.apiKey === 'mock-key') {
      console.log('[EPD API] Using mock data');
      return this.getMockData() as T;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[EPD API] Requesting: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EPD API error (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      
      // Handle XML response (ILCD/EPD format)
      if (contentType?.includes('xml')) {
        const xmlText = await response.text();
        return this.parseXMLResponse(xmlText) as T;
      }

      // Handle JSON response
      const data = await response.json() as T;
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getMockData(): unknown {
    // Return a mock paginated response with some realistic EPD data
    return {
      data: [
        {
          epd_number: "S-P-00123",
          product_name: "Low Carbon Concrete",
          manufacturer: "GreenBuild Co",
          gwp_fossil_a1a3: 240.5,
          valid_from: "2023-01-01T00:00:00Z",
          valid_until: "2028-01-01T00:00:00Z",
          declared_unit: "1 m3",
          certifications: ["ISO 14025"],
          geographic_scope: ["Global"]
        },
        {
          epd_number: "S-P-00456",
          product_name: "Recycled Steel Beam",
          manufacturer: "SteelWorks",
          gwp_fossil_a1a3: 850.2,
          valid_from: "2023-05-15T00:00:00Z",
          valid_until: "2028-05-15T00:00:00Z",
          declared_unit: "1 ton",
          certifications: ["ISO 14025"],
          geographic_scope: ["EU"]
        },
        {
          epd_number: "S-P-00789",
          product_name: "Birch Plywood",
          manufacturer: "Nordic Wood",
          gwp_fossil_a1a3: 120.0,
          valid_from: "2023-03-10T00:00:00Z",
          valid_until: "2028-03-10T00:00:00Z",
          declared_unit: "1 m3",
          certifications: ["FSC", "ISO 14025"],
          geographic_scope: ["Global"]
        }
      ],
      meta: {
        total: 3,
        page: 1,
        perPage: 20,
        totalPages: 1
      }
    };
  }

  /**
   * Parse XML response and convert to JSON structure
   * Basic XML parsing for ILCD/EPD format
   */
  private parseXMLResponse(xml: string): unknown {
    // Simple XML to JSON conversion
    // For production, consider using a proper XML parser like 'fast-xml-parser'
    const epds: EPDApiResponse[] = [];
    
    // Extract EPD entries from XML
    const epdRegex = /<epd[^>]*>([\s\S]*?)<\/epd>/gi;
    const matches = xml.matchAll(epdRegex);
    
    for (const match of matches) {
      const epdXml = match[1];
      if (!epdXml) continue;
      
      const epd: Partial<EPDApiResponse> = {};
      
      // Extract fields using regex (basic approach)
      const extractField = (fieldName: string): string | undefined => {
        const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)<\/${fieldName}>`, 'i');
        const fieldMatch = epdXml.match(regex);
        return fieldMatch?.[1]?.trim();
      };
      
      const extractNumber = (fieldName: string): number | undefined => {
        const value = extractField(fieldName);
        return value ? parseFloat(value) : undefined;
      };
      
      epd.epd_number = extractField('registrationNumber') || extractField('uuid');
      epd.product_name = extractField('name') || extractField('productName');
      epd.manufacturer = extractField('manufacturer');
      epd.gwp_fossil_a1a3 = extractNumber('gwp_a1a3') || extractNumber('gwpA1A3');
      epd.recycled_content_pct = extractNumber('recycledContent');
      epd.valid_from = extractField('publishedDate') || extractField('validFrom');
      epd.valid_until = extractField('validUntil');
      epd.declared_unit = extractField('declaredUnit');
      
      // Extract certifications
      const certsRegex = /<certification[^>]*>([^<]*)<\/certification>/gi;
      const certMatches = epdXml.matchAll(certsRegex);
      epd.certifications = Array.from(certMatches, m => m[1]?.trim()).filter(Boolean) as string[];
      
      if (epd.epd_number && epd.product_name) {
        epds.push(epd as EPDApiResponse);
      }
    }
    
    return { data: epds };
  }

  /**
   * Fetch EPDs with pagination
   */
  async fetchEPDs(options: FetchEPDsOptions = {}): Promise<PaginatedResponse> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 50;
    
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (options.search) {
      params.append('search', options.search);
    }
    if (options.manufacturer) {
      params.append('manufacturer', options.manufacturer);
    }

    const endpoint = `/epds?${params.toString()}`;
    
    try {
      const rawResponse = await this.makeRequest<unknown>(endpoint);
      
      // Handle different response formats
      let data: unknown[] = [];
      let meta: PaginatedResponse['meta'];
      
      if (Array.isArray(rawResponse)) {
        data = rawResponse;
      } else if (typeof rawResponse === 'object' && rawResponse !== null) {
        const responseObj = rawResponse as Record<string, unknown>;
        
        // Try different data field names
        if (Array.isArray(responseObj['data'])) {
          data = responseObj['data'];
        } else if (Array.isArray(responseObj['epds'])) {
          data = responseObj['epds'];
        } else if (Array.isArray(responseObj['results'])) {
          data = responseObj['results'];
        }
        
        // Extract metadata
        if (responseObj['meta'] && typeof responseObj['meta'] === 'object') {
          meta = responseObj['meta'] as PaginatedResponse['meta'];
        } else if (responseObj['pagination'] && typeof responseObj['pagination'] === 'object') {
          const pagination = responseObj['pagination'] as Record<string, unknown>;
          meta = {
            total: typeof pagination['total'] === 'number' ? pagination['total'] : undefined,
            page: typeof pagination['page'] === 'number' ? pagination['page'] : undefined,
            perPage: typeof pagination['per_page'] === 'number' ? pagination['per_page'] : undefined,
            totalPages: typeof pagination['total_pages'] === 'number' ? pagination['total_pages'] : undefined,
          };
        }
      }
      
      // Validate EPDs
      const validatedEPDs: EPDApiResponse[] = [];
      for (const item of data) {
        try {
          const validated = epdApiResponseSchema.parse(item);
          validatedEPDs.push(validated);
        } catch (error) {
          console.warn('[EPD API] Skipping invalid EPD:', error);
        }
      }
      
      return {
        data: validatedEPDs,
        meta,
      };
    } catch (error) {
      console.error('[EPD API] Fetch error:', error);
      throw error;
    }
  }

  /**
   * Fetch all EPDs with automatic pagination
   * Supports optional limit for testing
   */
  async fetchAllEPDs(options: FetchEPDsOptions = {}): Promise<EPDApiResponse[]> {
    const allEPDs: EPDApiResponse[] = [];
    const perPage = options.perPage ?? 50;
    const limit = options.limit;
    
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore && (!limit || allEPDs.length < limit)) {
      console.log(`[EPD API] Fetching page ${currentPage}...`);
      
      const response = await this.fetchEPDs({
        page: currentPage,
        perPage,
      });
      
      allEPDs.push(...response.data);
      
      // Check if there are more pages
      if (response.meta?.totalPages) {
        hasMore = currentPage < response.meta.totalPages;
      } else {
        // If no pagination metadata, assume no more pages if we got fewer results than requested
        hasMore = response.data.length === perPage;
      }
      
      // Check if we've hit the limit
      if (limit && allEPDs.length >= limit) {
        console.log(`[EPD API] Reached limit of ${limit} EPDs`);
        return allEPDs.slice(0, limit);
      }
      
      currentPage++;
      
      // Rate limiting - wait 200ms between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return allEPDs;
  }
}

/**
 * Normalize EPD data from API response to database format
 */
export function normalizeEPD(apiResponse: EPDApiResponse): NormalizedEPD | null {
  try {
    // Extract EPD number
    const epd_number = apiResponse.epd_number 
      || apiResponse.registrationNumber 
      || apiResponse.registration_number 
      || apiResponse.uuid;
    
    if (!epd_number) {
      console.warn('[EPD Normalize] Missing EPD number');
      return null;
    }
    
    // Extract product name
    const product_name = apiResponse.product_name 
      || apiResponse.productName 
      || apiResponse.name;
    
    if (!product_name) {
      console.warn('[EPD Normalize] Missing product name');
      return null;
    }
    
    // Extract manufacturer
    let manufacturer: string;
    if (typeof apiResponse.manufacturer === 'string') {
      manufacturer = apiResponse.manufacturer;
    } else if (apiResponse.manufacturer && typeof apiResponse.manufacturer === 'object') {
      manufacturer = apiResponse.manufacturer.name || 'Unknown';
    } else {
      manufacturer = 'Unknown';
    }
    
    // Extract GWP A1-A3
    const gwp_fossil_a1a3 = apiResponse.gwp_fossil_a1a3
      || apiResponse.gwp_a1a3
      || apiResponse.gwpA1A3
      || apiResponse.impacts?.gwp?.a1a3
      || apiResponse.impacts?.gwp?.fossil?.a1a3
      || null;
    
    // Extract recycled content
    const recycled_content_pct = apiResponse.recycled_content_pct
      || apiResponse.recycledContent
      || apiResponse.recycled_content
      || null;
    
    // Extract certifications
    let certifications: string[] = [];
    if (Array.isArray(apiResponse.certifications)) {
      certifications = apiResponse.certifications.map(cert => {
        if (typeof cert === 'string') {
          return cert;
        } else if (cert && typeof cert === 'object' && 'name' in cert) {
          return cert.name;
        }
        return '';
      }).filter(Boolean);
    }
    
    // Extract validity dates
    const valid_from = apiResponse.valid_from
      || apiResponse.validFrom
      || apiResponse.validity_start
      || apiResponse.validityStart
      || apiResponse.publishedDate;
    
    const valid_until = apiResponse.valid_until
      || apiResponse.validUntil
      || apiResponse.validity_end
      || apiResponse.validityEnd;
    
    if (!valid_from || !valid_until) {
      console.warn('[EPD Normalize] Missing validity dates');
      return null;
    }
    
    // Extract declared unit
    let declared_unit: string | null = null;
    if (typeof apiResponse.declaredUnit === 'string') {
      declared_unit = apiResponse.declaredUnit;
    } else if (apiResponse.declaredUnit && typeof apiResponse.declaredUnit === 'object') {
      declared_unit = apiResponse.declaredUnit.unit || null;
    } else if (apiResponse.declared_unit) {
      declared_unit = apiResponse.declared_unit;
    }
    
    // Extract PCR reference
    let pcr_reference: string | null = null;
    if (typeof apiResponse.pcr === 'string') {
      pcr_reference = apiResponse.pcr;
    } else if (apiResponse.pcr && typeof apiResponse.pcr === 'object') {
      pcr_reference = apiResponse.pcr.name || null;
    } else if (apiResponse.pcr_reference) {
      pcr_reference = apiResponse.pcr_reference;
    }
    
    // Extract geographic scope
    let geographic_scope: string[] = [];
    if (Array.isArray(apiResponse.geographic_scope)) {
      geographic_scope = apiResponse.geographic_scope;
    } else if (typeof apiResponse.geographic_scope === 'string') {
      geographic_scope = [apiResponse.geographic_scope];
    } else if (Array.isArray(apiResponse.geographicScope)) {
      geographic_scope = apiResponse.geographicScope;
    } else if (typeof apiResponse.geographicScope === 'string') {
      geographic_scope = [apiResponse.geographicScope];
    }
    
    return {
      epd_number,
      product_name,
      manufacturer,
      gwp_fossil_a1a3,
      recycled_content_pct,
      certifications,
      valid_from,
      valid_until,
      declared_unit,
      pcr_reference,
      geographic_scope,
      data_source: 'EPD International',
      raw_data: apiResponse as Record<string, unknown>,
    };
  } catch (error) {
    console.error('[EPD Normalize] Error:', error);
    return null;
  }
}
