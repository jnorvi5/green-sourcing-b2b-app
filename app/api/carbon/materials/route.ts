import { NextResponse } from 'next/server';

export async function GET() {
  // Mock response - MongoDB disabled
  return NextResponse.json({
    materials: [], // or some mock data if needed
    source: 'mock'
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=59',
    },
  });
}
