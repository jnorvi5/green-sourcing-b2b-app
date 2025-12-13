import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Mock response - MongoDB disabled
  return NextResponse.json({
    results: [],
    source: 'mock'
  });
}
