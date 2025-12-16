import { redis } from '@/lib/redis';
import { searchEC3Materials } from '@/lib/integrations/ec3/client';
import { EPDInternationalClient } from '@/lib/integrations/epd-international';
import { checkFSCCertification } from '@/lib/integrations/fsc';
import { getEmbodiedCarbon } from '@/lib/autodesk';

/**
 * GreenChainz Data Aggregation Agent
 * 
 * Fetches sustainability data from multiple APIs in a specific sequential order:
 * 1. EC3 (Building Transparency)
 * 2. EPD International
 * 3. FSC
 * 4. Autodesk Sustainability
 * 
 * Rules:
 * - One API at a time (sequential)
 * - Wait 500ms between calls
 * - Fail gracefully (return "unavailable")
 * - Cache aggressively (24h)
 * - OUTPUT: Flat JSON format as requested
 */

export interface SustainabilityData {
  product_id: string;
  material_type: string;
  supplier_name?: string;
  embodied_carbon_gwp?: string;
  ec3_source?: string;
  epd_certified: boolean;
  fsc_certified: boolean;
  autodesk_carbon_score?: string;
  data_freshness: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callEC3API(query: string): Promise<{ gwp: string; source: string; raw: unknown } | null> {
  const results = await searchEC3Materials(query, 1);
  if (results.length > 0) {
    const bestMatch = results[0];
    return {
      gwp: `${bestMatch.gwp.value} ${bestMatch.gwp.unit}`,
      source: 'Building Transparency EC3',
      raw: bestMatch
    };
  }
  return null;
}

async function callEPDAPI(productId: string): Promise<{ certified: boolean; data: unknown } | null> {
    const apiKey = process.env['EPD_API_KEY'];
    if (!apiKey && process.env.NODE_ENV === 'production') {
        console.warn('[DataAgent] EPD_API_KEY missing in production');
        return null;
    }

    const client = new EPDInternationalClient({
        apiKey: apiKey || 'mock-key',
    });
    
    try {
        const response = await client.fetchEPDs({ perPage: 20 });
        const match = response.data.find(e => 
            e.product_name?.toLowerCase().includes(productId.toLowerCase()) ||
            e.epd_number?.toLowerCase() === productId.toLowerCase()
        );

        if (match) {
            return {
                certified: true,
                data: match
            };
        }
        return null; // Not found
    } catch (e) {
        console.warn('EPD API Error:', e);
        return null;
    }
}

async function callFSCAPI(productId: string): Promise<{ certified?: boolean } | null> {
  return await checkFSCCertification(productId) as { certified?: boolean } | null;
}

async function callAutodeskAPI(productId: string, _category: string): Promise<{ carbon_score: string; gwp: number; unit: string } | null> {
   const data = await getEmbodiedCarbon(productId);
   if (data) {
     return {
         carbon_score: data.gwp < 10 ? 'A' : (data.gwp < 50 ? 'B' : 'C'),
         gwp: data.gwp,
         unit: data.gwpUnit || 'kgCO2e'
     };
   }
   return null;
}

export async function fetchSustainabilityData(productId: string, materialType: string): Promise<SustainabilityData> {
  const flattened: Partial<SustainabilityData> = {
      product_id: productId,
      material_type: materialType,
      data_freshness: new Date().toISOString(),
      epd_certified: false,
      fsc_certified: false
  };
  
  // 1. Check cache
  const cacheKey = `product:${productId}:sustainability:flat`;
  try {
      const cached = await redis.get(cacheKey) as { timestamp?: number; data?: SustainabilityData } | null;
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < 86400000)) {
        console.log(`[DataAgent] Cache hit for ${productId}`);
        return cached.data as SustainabilityData;
      }
  } catch (err) {
      console.warn('Cache check failed:', err);
  }
  
  // 2. Call EC3 API
  try {
    console.log('[DataAgent] Calling EC3...');
    const ec3Data = await callEC3API(`${materialType} ${productId}`);
    if (ec3Data) {
        flattened.embodied_carbon_gwp = ec3Data.gwp;
        flattened.ec3_source = ec3Data.source;
    } else {
        // flattened.embodied_carbon_gwp = "Unavailable";
    }
  } catch (error) {
    console.error('[DataAgent] EC3 failed:', error);
  }
  await sleep(500);
  
  // 3. Call EPD API
  try {
    console.log('[DataAgent] Calling EPD International...');
    const epdData = await callEPDAPI(productId);
    if (epdData && epdData.certified) {
        flattened.epd_certified = true;
    }
  } catch (error) {
    console.error('[DataAgent] EPD failed:', error);
  }
  await sleep(500);
  
  // 4. Call FSC API
  try {
    console.log('[DataAgent] Calling FSC...');
    const fscData = await callFSCAPI(productId);
    if (fscData && fscData.certified) {
        flattened.fsc_certified = true;
    }
  } catch (error) {
    console.error('[DataAgent] FSC failed:', error);
  }

  // 4.5 Call Autodesk API
  await sleep(500);
  try {
      console.log('[DataAgent] Calling Autodesk...');
      const autodeskData = await callAutodeskAPI(productId, materialType);
      if (autodeskData) {
          flattened.autodesk_carbon_score = autodeskData.carbon_score;
      }
  } catch (error) {
      console.error('[DataAgent] Autodesk failed:', error);
  }
  
  const finalData = flattened as SustainabilityData;

  // 5. Cache result
  try {
      await redis.set(cacheKey, {
        data: finalData,
        timestamp: Date.now()
      }, { ex: 86400 });
  } catch (err) {
      console.warn('Cache set failed:', err);
  }
  
  return finalData;
}
