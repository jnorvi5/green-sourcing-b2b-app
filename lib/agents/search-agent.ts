/**
 * Search Agent
 * 
 * Analyzes natural language queries to extract intent and filters.
 * Designed to be extensible for external data sources (Autodesk, EC3, EPD International).
 */

export interface SearchIntent {
  query: string; // Cleaned query for text search
  filters: {
    category?: string;
    certifications?: string[];
    maxCarbon?: number;
    materialType?: string;
    supplier?: string;
  };
  externalSources: {
    autodesk: boolean;
    ec3: boolean;
    epdInternational: boolean;
  };
  isSmartSearch: boolean; // True if agent modified the query/filters
}

export function parseQuery(rawQuery: string): SearchIntent {
  const lowerQuery = rawQuery.toLowerCase();
  
  const intent: SearchIntent = {
    query: rawQuery,
    filters: {},
    externalSources: {
      autodesk: false,
      ec3: false,
      epdInternational: false,
    },
    isSmartSearch: false,
  };

  // 1. Detect External Source Intent
  if (lowerQuery.includes('autodesk') || lowerQuery.includes('bim') || lowerQuery.includes('revit')) {
    intent.externalSources.autodesk = true;
    intent.isSmartSearch = true;
  }
  if (lowerQuery.includes('ec3') || lowerQuery.includes('embodied carbon') || lowerQuery.includes('building transparency')) {
    intent.externalSources.ec3 = true;
    intent.isSmartSearch = true;
  }
  if (lowerQuery.includes('epd') || lowerQuery.includes('declaration')) {
    intent.externalSources.epdInternational = true;
    intent.isSmartSearch = true;
  }

  // 2. Extract Certifications
  const certMap: Record<string, string> = {
    'fsc': 'FSC',
    'leed': 'LEED',
    'b corp': 'B Corp',
    'cradle to cradle': 'Cradle to Cradle',
    'c2c': 'Cradle to Cradle',
    'iso 14001': 'ISO 14001',
  };

  const foundCerts: string[] = [];
  let cleanQuery = rawQuery;

  Object.entries(certMap).forEach(([keyword, certName]) => {
    // Check for whole word match
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleanQuery)) {
      foundCerts.push(certName);
      cleanQuery = cleanQuery.replace(regex, '').replace(/\s+/g, ' ').trim();
      intent.isSmartSearch = true;
    }
  });

  if (foundCerts.length > 0) {
    intent.filters.certifications = foundCerts;
  }

  // 3. Extract Carbon Limits (e.g., "under 50kg", "< 100 carbon")
  // Regex to find "under X" or "< X" followed optionally by "kg" or "carbon"
  const carbonRegex = /(?:under|less than|<)\s*(\d+)(?:\s*(?:kg|carbon|co2))?/i;
  const carbonMatch = lowerQuery.match(carbonRegex);
  
  if (carbonMatch) {
    const value = parseInt(carbonMatch[1], 10);
    if (!isNaN(value)) {
      intent.filters.maxCarbon = value;
      // Remove the matched part from query for cleaner text search
      cleanQuery = cleanQuery.replace(carbonMatch[0], '').replace(/\s+/g, ' ').trim();
      intent.isSmartSearch = true;
    }
  }

  // 4. Extract Material Types (Simple keyword matching for now)
  const materials = ['wood', 'concrete', 'steel', 'glass', 'insulation', 'flooring', 'tile'];
  for (const mat of materials) {
    const regex = new RegExp(`\\b${mat}\\b`, 'i');
    if (regex.test(cleanQuery)) {
      intent.filters.materialType = mat; // We keep it in the query too for text relevance, but flag it
      // Don't remove material from query as it's useful for text search relevance
      break; 
    }
  }

  intent.query = cleanQuery;

  return intent;
}
