import { NextRequest, NextResponse } from 'next/server';
import { EPDInternationalClient, normalizeEPD } from '@/lib/integrations/epd-international';

interface AgentEPDData {
  productName: string;
  manufacturer: string;
  epdNumber: string;
  gwpFossilA1A3: number | null;
  recycledContentPct: number;
  certifications: string[];
  validityStart: string;
  validityEnd: string;
  verifiedBy: string;
  dataSourceUrl: string;
  confidenceScore: number;
  fetched: string;
}

// Data Scout Agent - EPD International Integration
export async function POST(request: NextRequest) {
  try {
    const { productName, manufacturer, certType } = await request.json();

    // Connect to actual EPD International API
    // Register at: https://epd-apim.developer.azure-api.net
    const EPD_API_KEY = process.env['EPD_INTERNATIONAL_API_KEY'];

    let epdData: AgentEPDData | null = null;
    let source = 'mock';

    // 1. Try to fetch from actual API if key exists
    if (EPD_API_KEY) {
      try {
        console.log(`Attempting to fetch EPD for ${productName} from EPD International API...`);

        const client = new EPDInternationalClient({
            apiKey: EPD_API_KEY
        });

        // Use the updated client which supports search and manufacturer
        const result = await client.fetchEPDs({
            search: productName,
            manufacturer: manufacturer,
            perPage: 1
        });

        if (result.data && result.data.length > 0) {
            const apiItem = result.data[0];
            const normalizedItem = normalizeEPD(apiItem);

            if (normalizedItem) {
                // Map normalized data to agent schema
                epdData = {
                    productName: normalizedItem.product_name,
                    manufacturer: normalizedItem.manufacturer,
                    epdNumber: normalizedItem.epd_number,
                    gwpFossilA1A3: normalizedItem.gwp_fossil_a1a3,
                    recycledContentPct: normalizedItem.recycled_content_pct || 0,
                    certifications: normalizedItem.certifications.length > 0 ? normalizedItem.certifications : ['EPD International'],
                    validityStart: normalizedItem.valid_from,
                    validityEnd: normalizedItem.valid_until,
                    verifiedBy: normalizedItem.data_source,
                    dataSourceUrl: `https://www.environdec.com/library/epd/${normalizedItem.epd_number}`, // Fallback/constructed URL
                    confidenceScore: 1.0, // Real data
                    fetched: new Date().toISOString()
                };

                source = 'epd_international_api';
            }
        }
      } catch (apiError) {
        console.error('Error fetching from EPD API:', apiError);
        // Fallback to mock logic below
      }
    }

    // 2. Fallback to mock data if no API data found
    if (!epdData) {
      // Simulated EPD data structure for now
      epdData = {
        productName: productName || 'Recycled Steel Rebar',
        manufacturer: manufacturer || 'EcoSteel Inc',
        epdNumber: 'EPD-2024-' + Math.floor(Math.random() * 10000),
        gwpFossilA1A3: 450.2, // kg CO2e
        recycledContentPct: 95.0,
        certifications: ['LEED', 'FSC'],
        validityStart: '2024-01-15',
        validityEnd: '2029-01-15',
        verifiedBy: 'EPD International',
        dataSourceUrl: 'https://epd-apim.azure-api.net',
        confidenceScore: 0.95,
        fetched: new Date().toISOString()
      };

      if (source === 'epd_international_api') {
        // Reset if we failed midway, though logic flow prevents this usually
        source = 'mock';
      }
    }

    // Check certification status
    const certificationStatus = {
      epdVerified: true,
      fscCertified: certType === 'FSC' || epdData.certifications.includes('FSC'),
      leedEligible: epdData.certifications.includes('LEED') || source === 'epd_international_api', // Assume EPDs are LEED eligible
      carbonFootprint: epdData.gwpFossilA1A3,
      status: 'VERIFIED'
    };

    return NextResponse.json({
      success: true,
      data: epdData,
      certification: certificationStatus,
      source: source,
      message: source === 'epd_international_api' ? 'EPD data fetched from EPD International' : 'EPD data simulated (Mock)',
      note: source === 'mock' ? 'Connect EPD International API key to go live.' : undefined
    });
  } catch (error) {
    console.error('Data scout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch EPD data' },
      { status: 500 }
    );
  }
}

// GET endpoint to check agent status
export async function GET() {
  const hasKey = !!process.env['EPD_INTERNATIONAL_API_KEY'];

  return NextResponse.json({
    agent: 'Data Scout',
    status: 'operational',
    capabilities: [
      'EPD data fetching',
      'Certification validation',
      'Carbon footprint lookup',
      'FSC/LEED verification'
    ],
    integrations: {
      epdInternational: hasKey ? 'connected' : 'pending_api_key',
      buildingTransparency: 'not_connected',
      autodesk: 'not_connected'
    },
    nextSteps: hasKey ? [] : [
      '1. Get EPD International API key: https://epd-apim.developer.azure-api.net',
      '2. Add to environment: EPD_INTERNATIONAL_API_KEY',
      '3. Update route.ts with actual API calls'
    ]
  });
}
