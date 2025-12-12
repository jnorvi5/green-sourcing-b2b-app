import { NextRequest, NextResponse } from 'next/server';
import { fetchSustainabilityData } from '@/lib/agents/data-aggregation';

/**
 * Intercom Fin / Custom Action Endpoint
 * 
 * This endpoint is designed to be called by Intercom's Fin AI bot or Custom Actions.
 * It exposes the Sustainability Data Aggregation Agent.
 * 
 * Security: Requires 'x-api-key' header matching INTERCOM_ACTION_SECRET
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Security
    const authHeader = request.headers.get('x-api-key');
    const secret = process.env['INTERCOM_ACTION_SECRET'];

    if (!secret || authHeader !== secret) {
      if (!secret) console.warn('INTERCOM_ACTION_SECRET not configured');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Input
    const body = await request.json();
    const { product_id, material_type } = body;

    if (!product_id || !material_type) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, material_type' },
        { status: 400 }
      );
    }

    // 3. Call The Agent
    const data = await fetchSustainabilityData(product_id, material_type);

    // 4. Return Formatted Response
    // We return the flat format directly as Fin handles JSON well
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Intercom API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing sustainability request' },
      { status: 500 }
    );
  }
}
