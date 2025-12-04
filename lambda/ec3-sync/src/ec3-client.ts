/**
 * EC3 API Client
 * Fetches embodied carbon data from Building Transparency's EC3 API
 */

import { z } from 'zod';

// EC3 Material Response Schema
const EC3MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  plant: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  gwp: z.object({
    value: z.number(),
    unit: z.string().default('kgCO2e'),
    declared_unit: z.string().optional(),
  }).optional(),
  epd: z.object({
    id: z.string().optional(),
    program_operator: z.string().optional(),
    valid_until: z.string().optional(),
    document_url: z.string().optional(),
  }).optional(),
  category_details: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type EC3Material = z.infer<typeof EC3MaterialSchema>;

const EC3ResponseSchema = z.object({
  materials: z.array(EC3MaterialSchema),
  pagination: z.object({
    page: z.number(),
    per_page: z.number(),
    total_count: z.number(),
    total_pages: z.number(),
  }).optional(),
});

export type EC3Response = z.infer<typeof EC3ResponseSchema>;

interface EC3ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface FetchOptions {
  page?: number;
  perPage?: number;
  category?: string;
  updatedSince?: string;
}

export class EC3Client {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: EC3ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://buildingtransparency.org/api';
    this.timeout = config.timeout ?? 30000;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
        throw new Error(`EC3 API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as T;
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch materials from EC3 API with pagination
   */
  async fetchMaterials(options: FetchOptions = {}): Promise<EC3Response> {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.perPage) params.set('per_page', options.perPage.toString());
    if (options.category) params.set('category', options.category);
    if (options.updatedSince) params.set('updated_since', options.updatedSince);

    const queryString = params.toString();
    const endpoint = `/materials${queryString ? `?${queryString}` : ''}`;

    const rawResponse = await this.makeRequest<unknown>(endpoint);
    
    // Handle different response formats
    let materials: unknown[];
    let pagination: EC3Response['pagination'];
    
    if (Array.isArray(rawResponse)) {
      materials = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const responseObj = rawResponse as Record<string, unknown>;
      materials = Array.isArray(responseObj['materials']) 
        ? responseObj['materials'] 
        : Array.isArray(responseObj['data']) 
          ? responseObj['data'] 
          : [];
      
      if (responseObj['pagination'] && typeof responseObj['pagination'] === 'object') {
        pagination = responseObj['pagination'] as EC3Response['pagination'];
      }
    } else {
      materials = [];
    }

    // Validate and transform materials
    const validatedMaterials: EC3Material[] = [];
    for (const material of materials) {
      try {
        const validated = EC3MaterialSchema.parse(material);
        validatedMaterials.push(validated);
      } catch (error) {
        console.warn('Skipping invalid material:', error);
      }
    }

    return {
      materials: validatedMaterials,
      pagination,
    };
  }

  /**
   * Fetch all materials with automatic pagination
   */
  async fetchAllMaterials(options: Omit<FetchOptions, 'page'> = {}): Promise<EC3Material[]> {
    const allMaterials: EC3Material[] = [];
    let currentPage = 1;
    const perPage = options.perPage ?? 100;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${currentPage}...`);
      
      const response = await this.fetchMaterials({
        ...options,
        page: currentPage,
        perPage,
      });

      allMaterials.push(...response.materials);

      if (response.pagination) {
        hasMore = currentPage < response.pagination.total_pages;
      } else {
        hasMore = response.materials.length === perPage;
      }

      currentPage++;

      // Rate limiting - wait 100ms between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allMaterials;
  }

  /**
   * Fetch a single material by ID
   */
  async fetchMaterial(id: string): Promise<EC3Material | null> {
    try {
      const rawResponse = await this.makeRequest<unknown>(`/materials/${id}`);
      return EC3MaterialSchema.parse(rawResponse);
    } catch (error) {
      console.error(`Failed to fetch material ${id}:`, error);
      return null;
    }
  }

  /**
   * Search materials by name or description
   */
  async searchMaterials(query: string, limit = 50): Promise<EC3Material[]> {
    const params = new URLSearchParams({
      q: query,
      per_page: limit.toString(),
    });

    const rawResponse = await this.makeRequest<unknown>(`/materials/search?${params.toString()}`);
    
    let materials: unknown[];
    if (Array.isArray(rawResponse)) {
      materials = rawResponse;
    } else if (typeof rawResponse === 'object' && rawResponse !== null) {
      const responseObj = rawResponse as Record<string, unknown>;
      materials = Array.isArray(responseObj['materials']) 
        ? responseObj['materials'] 
        : Array.isArray(responseObj['results']) 
          ? responseObj['results'] 
          : [];
    } else {
      materials = [];
    }

    const validatedMaterials: EC3Material[] = [];
    for (const material of materials) {
      try {
        const validated = EC3MaterialSchema.parse(material);
        validatedMaterials.push(validated);
      } catch {
        // Skip invalid materials
      }
    }

    return validatedMaterials;
  }
}
