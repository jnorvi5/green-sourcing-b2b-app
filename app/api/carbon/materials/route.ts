import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Mock response - MongoDB disabled
  return NextResponse.json({
    materials: [], // or some mock data if needed
    source: 'mock'
  });
}
