import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';

  // Mock data for MVP
  const suppliers = [
    {
      id: 'sup_1',
      company_name: 'GreenBuild Supplies',
      description: 'Premier supplier of sustainable building materials.',
      location: 'New York, NY',
      certifications: ['ISO 14001', 'B Corp'],
      epd_verified: true,
      fsc_verified: true,
      bcorp_verified: true,
      leed_verified: false,
      verification_source: 'EPD',
      agent_insight: 'Top rated for low-carbon concrete',
      matched_products: [
        {
          _id: 'prod_1',
          title: 'Low Carbon Concrete',
          price: 150,
          currency: 'USD',
          material_type: 'Concrete' // Added for Agent
        },
        {
          _id: 'prod_2',
          title: 'Recycled Steel Beam',
          price: 450,
          currency: 'USD',
          material_type: 'Steel'
        }
      ]
    },
    {
      id: 'sup_2',
      company_name: 'Nordic Wood Co',
      description: 'Sustainable timber directly from certified forests.',
      location: 'Portland, OR',
      certifications: ['FSC', 'PEFC'],
      epd_verified: true,
      fsc_verified: true,
      bcorp_verified: false,
      leed_verified: true,
      verification_source: 'EC3',
      matched_products: [
        {
          _id: 'prod_3',
          title: 'Birch Plywood',
          price: 85,
          currency: 'USD',
          material_type: 'Wood'
        }
      ]
    }
  ];

  // Simple filter
  const filtered = suppliers.filter(s => {
    if (q && !s.company_name.toLowerCase().includes(q.toLowerCase()) &&
        !s.matched_products.some(p => p.title.toLowerCase().includes(q.toLowerCase()))) return false;
    if (location && !s.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  return NextResponse.json({
    results: [],
    source: 'mock'
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=59',
    }
  });
}
