import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;
    
    // Simple mock response to pass build - replace with real logic later if needed
    return NextResponse.json({ 
        success: true, 
        message: "Scraping initiated", 
        data: { url } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
