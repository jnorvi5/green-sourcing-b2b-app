/**
 * EPD International API Client
 * Fetches Environmental Product Declaration data from EPD International API
 */

import { z } from 'zod';

// EPD Response Schema
const EPDProductSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  registrationNumber: z.string().optional(),
  status: z.string().optional(),
  validUntil: z.string().optional(),
  publishedDate: z.string().optional(),
  declaredUnit: z.object({
    value: z.number().optional(),
    unit: z.string().optional(),
  }).optional(),
  manufacturer: z.object({
    name: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  productCategory: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
  }).optional(),
  pcr: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
  programOperator: z.object({
    name: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  impacts: z.object({
    gwp: z.object({
      a1a3: z.number().optional(),
      a4: z.number().optional(),
      a5: z.number().optional(),
      b1: z.number().optional(),
      b2: z.number().optional(),
      b3: z.number().optional(),
      b4: z.number().optional(),
      b5: z.number().optional(),
      b6: z.number().optional(),
      b7: z.number().optional(),
      c1: z.number().optional(),
      c2: z.number().optional(),
      c3: z.number().optional(),
      c4: z.number().optional(),
      d: z.number().optional(),
      total: z.number().optional(),
    }).optional(),
    odp: z.number().optional(),
    ap: z.number().optional(),
    ep: z.number().optional(),
    pocp: z.number().optional(),
    adpe: z.number().optional(),
    adpf: z.number().optional(),
  }).optional(),
  documentUrl: z.string().optional(),
  externalLinks: z.array(z.object({
    type: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
});

export type EPDProduct = z.infer<typeof EPDProductSchema>;

const EPDResponseSchema = z.object({
  data: z.array(EPDProductSchema),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    perPage: z.number().optional(),
    totalPages: z.number().optional(),
  }).optional(),
});

export type EPDResponse = z.infer<typeof EPDResponseSchema>;

interface EPDClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface FetchOptions {
  page?: number;
  perPage?: number;
  status?: 'valid' | 'expired' | 'all';
  category?: string;
  modifiedSince?: string;
}

export class EPDClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: EPDClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://epd-apim.developer.azure-api.net/v1';
    this.timeout = config.timeout ?? 60000;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
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

      const data = await response.json() as T;
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch EPDs from EPD International API with pagination
   */
  async fetchEPDs(options: FetchOptions = {}): Promise<EPDResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.perPage) params.set('per_page', options.perPage.toString());
    if (options.status) params.set('status', options.status);
    if (options.category) params.set('category', options.category);
    if (options.modifiedSince) params.set('modified_since', options.modifiedSince);

    const queryString = params.toString();
    const endpoint = `/epds${queryString ? `?${queryString}` : ''}`;

    const rawResponse = await this.makeRequest<unknown>(endpoint);
    
    // Handle different response formats
    let data: unknown[];
    let meta: EPDResponse['meta'];
    
    if (Array.isArray(rawResponse)) {
      data = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const responseObj = rawResponse as Record<string, unknown>;
      data = Array.isArray(responseObj['data']) 
        ? responseObj['data'] 
        : Array.isArray(responseObj['epds']) 
          ? responseObj['epds'] 
          : Array.isArray(responseObj['results'])
            ? responseObj['results']
            : [];
      
      if (responseObj['meta'] && typeof responseObj['meta'] === 'object') {
        meta = responseObj['meta'] as EPDResponse['meta'];
      } else if (responseObj['pagination'] && typeof responseObj['pagination'] === 'object') {
        const pagination = responseObj['pagination'] as Record<string, unknown>;
        meta = {
          total: typeof pagination['total'] === 'number' ? pagination['total'] : undefined,
          page: typeof pagination['page'] === 'number' ? pagination['page'] : undefined,
          perPage: typeof pagination['per_page'] === 'number' ? pagination['per_page'] : undefined,
          totalPages: typeof pagination['total_pages'] === 'number' ? pagination['total_pages'] : undefined,
        };
      }
    } else {
      data = [];
    }

    // Validate and transform EPDs
    const validatedEPDs: EPDProduct[] = [];
    for (const epd of data) {
      try {
        const validated = EPDProductSchema.parse(epd);
        validatedEPDs.push(validated);
      } catch (error) {
        console.warn('Skipping invalid EPD:', error);
      }
    }

    return {
      data: validatedEPDs,
      meta,
    };
  }

  /**
   * Fetch all EPDs with automatic pagination
   */
  async fetchAllEPDs(options: Omit<FetchOptions, 'page'> = {}): Promise<EPDProduct[]> {
    const allEPDs: EPDProduct[] = [];
    let currentPage = 1;
    const perPage = options.perPage ?? 100;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching EPD page ${currentPage}...`);
      
      const response = await this.fetchEPDs({
        ...options,
        page: currentPage,
        perPage,
      });

      allEPDs.push(...response.data);

      if (response.meta?.totalPages) {
        hasMore = currentPage < response.meta.totalPages;
      } else {
        hasMore = response.data.length === perPage;
      }

      currentPage++;

      // Rate limiting - wait 200ms between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return allEPDs;
  }

  /**
   * Fetch a single EPD by UUID
   */
  async fetchEPD(uuid: string): Promise<EPDProduct | null> {
    try {
      const rawResponse = await this.makeRequest<unknown>(`/epds/${uuid}`);
      
      if (typeof rawResponse === 'object' && rawResponse !== null) {
        const responseObj = rawResponse as Record<string, unknown>;
        const epdData = responseObj['data'] ?? responseObj;
        return EPDProductSchema.parse(epdData);
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch EPD ${uuid}:`, error);
      return null;
    }
  }

  /**
   * Search EPDs by name or manufacturer
   */
  async searchEPDs(query: string, limit = 50): Promise<EPDProduct[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: limit.toString(),
    });

    const rawResponse = await this.makeRequest<unknown>(`/epds/search?${params.toString()}`);
    
    let data: unknown[];
    if (Array.isArray(rawResponse)) {
      data = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const responseObj = rawResponse as Record<string, unknown>;
      data = Array.isArray(responseObj['data']) 
        ? responseObj['data'] 
        : Array.isArray(responseObj['results']) 
          ? responseObj['results'] 
          : [];
    } else {
      data = [];
    }

    const validatedEPDs: EPDProduct[] = [];
    for (const epd of data) {
      try {
        const validated = EPDProductSchema.parse(epd);
        validatedEPDs.push(validated);
      } catch {
        // Skip invalid EPDs
      }
    }

    return validatedEPDs;
  }
}
