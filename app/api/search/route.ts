import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Mock response - MongoDB disabled
  return NextResponse.json({
    results: [],
    source: 'mock'
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=59',
    },
  });
}
