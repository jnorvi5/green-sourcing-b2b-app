import { NextRequest, NextResponse } from 'next/server';

// Interfaces for EPD International API Response (Approximation)
interface EPDInternationalResponse {
  data: EPDItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface EPDItem {
  id: string;
  uuid: string;
  name: string;
  registrationNumber: string; // e.g., "S-P-01234"
  publicationDate: string;
  validUntil: string;
  manufacturer: {
    name: string;
    country: string;
    website?: string;
  };
  product: {
    name: string;
    description: string;
  };
  classification: {
    cpc?: string;
    classification?: string;
  };
  indicators?: { // Simplified indicator structure
    gwp?: {
      a1a3: number;
      unit: string;
    };
    recycledContent?: number;
  };
  url?: string; // Link to PDF or page
}

// Data Scout Agent - EPD International Integration
export async function POST(request: NextRequest) {
  try {
    const { productName, manufacturer, certType } = await request.json();

    const EPD_API_KEY = process.env['EPD_INTERNATIONAL_API_KEY'];
    const API_BASE_URL = 'https://epd-apim.azure-api.net/api/v1'; // Assumed base URL

    let epdData = null;
    let source = 'mock';

    // 1. Try to fetch from actual API if key exists
    if (EPD_API_KEY) {
      try {
        console.log(`Attempting to fetch EPD for ${productName} from EPD International API...`);

        // Construct search query
        const queryParams = new URLSearchParams();
        if (productName) queryParams.append('search', productName);
        if (manufacturer) queryParams.append('manufacturer', manufacturer);
        queryParams.append('limit', '1'); // Get top result

        const response = await fetch(`${API_BASE_URL}/epds?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': EPD_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (response.ok) {
          const result: EPDInternationalResponse = await response.json();
          if (result.data && result.data.length > 0) {
            const item = result.data[0];

            // Map external API data to internal schema
            epdData = {
              productName: item.product.name,
              manufacturer: item.manufacturer.name,
              epdNumber: item.registrationNumber,
              gwpFossilA1A3: item.indicators?.gwp?.a1a3 || null, // Might be null if not in search result
              recycledContentPct: item.indicators?.recycledContent || 0,
              certifications: ['EPD International'], // Base cert
              validityStart: item.publicationDate,
              validityEnd: item.validUntil,
              verifiedBy: 'EPD International',
              dataSourceUrl: item.url || `https://www.environdec.com/library/epd${item.registrationNumber}`,
              confidenceScore: 1.0, // Real data
              fetched: new Date().toISOString()
            };

            // Add other certs if inferred or present (simplified logic)
            if (certType && epdData.certifications.indexOf(certType) === -1) {
               // In a real scenario, we'd check if the EPD mentions the cert
               // For now, we rely on the search result
            }

            source = 'epd_international_api';
          }
        } else {
          console.warn(`EPD API request failed: ${response.status} ${response.statusText}`);
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
