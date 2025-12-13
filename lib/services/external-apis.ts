/**
 * External API Service Layer
 * 
 * Unified interface for querying external sustainability databases (EC3, EPD International).
 */

import { searchEC3Materials } from '@/lib/integrations/ec3/client';
import { EPDInternationalClient } from '@/lib/integrations/epd-international';

export interface ExternalProduct {
  source: 'EC3' | 'EPD' | 'Autodesk';
  productName: string;
  manufacturer: string;
  carbonFootprint?: number;
  certifications: string[];
  epdNumber?: string;
  url?: string;
}

export interface SearchIntent {
  query: string;
  filters: {
    materialType?: string;
    maxCarbon?: number;
    location?: string;
    certifications?: string[];
  };
  externalSources: {
    autodesk?: boolean;
    ec3?: boolean;
    epdInternational?: boolean;
  };
}

/**
 * Query Building Transparency's EC3 database
 */
export async function queryEC3(intent: SearchIntent): Promise<ExternalProduct[]> {
  if (!process.env['EC3_CLIENT_ID'] || !process.env['EC3_CLIENT_SECRET']) {
    console.warn('EC3 credentials missing, skipping query');
    return [];
  }

  try {
    // Construct query from intent
    let query = intent.query;
    if (intent.filters.materialType) {
      query += ` ${intent.filters.materialType}`;
    }

    const results = await searchEC3Materials(query, 10);

    return results.map(item => ({
      source: 'EC3',
      productName: item.name,
      manufacturer: item.manufacturer.name,
      carbonFootprint: item.gwp.value, // Assuming value is in kgCO2e/unit, might need normalization
      certifications: ['EC3 Listed'], // EC3 implies EPD existence usually
      url: item.epd_url
    }));
  } catch (error) {
    console.error('EC3 Service Error:', error);
    return [];
  }
}

/**
 * Query EPD International database
 */
export async function queryEPD(intent: SearchIntent): Promise<ExternalProduct[]> {
  if (!process.env['EPD_API_KEY']) {
    console.warn('EPD API key missing, skipping query');
    return [];
  }

  try {
    const client = new EPDInternationalClient({
      apiKey: process.env['EPD_API_KEY']
    });

    // The client currently fetches recent EPDs. 
    // Ideally we'd use a search endpoint, but for now we fetch and filter.
    // In a real scenario, we'd want to implement a proper search method in the client if the API supports it.
    // Assuming the client has a way to search or we filter a larger set.
    // For this implementation, we'll fetch a batch and filter client-side as a fallback,
    // mirroring the logic used in the agent tool.
    
    const response = await client.fetchEPDs({ perPage: 20 });
    
    const filtered = response.data.filter(epd => {
      const searchTerms = intent.query.toLowerCase().split(' ');
      const text = `${epd.product_name} ${epd.manufacturer}`.toLowerCase();
      return searchTerms.every(term => text.includes(term));
    });

    return filtered.map(epd => ({
      source: 'EPD',
      productName: epd.product_name || 'Unknown Product',
      manufacturer: typeof epd.manufacturer === 'string' ? epd.manufacturer : epd.manufacturer?.name || 'Unknown',
      carbonFootprint: epd.gwp_fossil_a1a3,
      certifications: ['EPD Verified', ...((epd.certifications as string[]) || [])],
      epdNumber: epd.epd_number,
      url: undefined // The API response type might need to be checked for a URL field if available
    }));

  } catch (error) {
    console.error('EPD Service Error:', error);
    return [];
  }
}

/**
 * Query Autodesk Construction Cloud (Placeholder)
 */
export async function queryAutodesk(): Promise<ExternalProduct[]> {
  // Placeholder for future implementation
  return [];
}
