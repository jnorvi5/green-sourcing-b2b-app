import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EPD_API_URL = process.env.EPD_API_URL || 'https://api.example.com/epd/search';
const EPD_API_KEY = process.env.EPD_API_KEY;

// Minimal Supabase client for optional persistence
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function fetchEpd(query: string) {
  if (!EPD_API_KEY) {
    // Mock response when no API key configured
    return {
      epd_number: 'MOCK-EPD-1234',
      product_name: 'Cellulose Insulation',
      program_operator: 'EPD International',
      gwp_fossil_a1_a3: 12.3,
      validity_start: '2024-01-01',
      validity_end: '2029-12-31',
      raw: { mocked: true, query },
    };
  }

  const resp = await fetch(`${EPD_API_URL}?q=${encodeURIComponent(query)}`, {
    headers: { 'x-api-key': EPD_API_KEY },
    cache: 'no-store',
  });

  if (resp.status === 404) throw new Error('EPD not found');
  if (resp.status === 429) throw new Error('Rate limited');
  if (!resp.ok) throw new Error(`EPD API error: ${resp.status}`);

  const data = await resp.json();
  // Normalize expected fields; adjust as real API spec becomes known
  return {
    epd_number: data?.epd_number ?? data?.id ?? 'unknown',
    product_name: data?.product_name ?? data?.name ?? 'unknown',
    program_operator: data?.program_operator ?? 'unknown',
    gwp_fossil_a1_a3: data?.gwp_fossil_a1_a3 ?? data?.gwp?.a1_a3 ?? null,
    validity_start: data?.validity_start ?? data?.valid_from ?? null,
    validity_end: data?.validity_end ?? data?.valid_to ?? null,
    raw: data,
  };
}

async function persistToSupabase(productId: string | null, parsed: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !productId) return { stored: false, reason: 'supabase_admin_missing_or_no_product' };

  const { error } = await supabase
    .from('products')
    .update({
      sustainability_data: {
        epd_number: parsed.epd_number,
        gwp_fossil_a1_a3: parsed.gwp_fossil_a1_a3,
        validity_start: parsed.validity_start,
        validity_end: parsed.validity_end,
        program_operator: parsed.program_operator,
        epd_source: 'epd-international',
        raw: parsed.raw,
      },
    })
    .eq('id', productId);

  if (error) return { stored: false, reason: error.message };
  return { stored: true };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const productId = searchParams.get('productId');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
    }

    let parsed;
    try {
      parsed = await fetchEpd(query);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'EPD lookup failed';
      const status = message.includes('not found') ? 404 : message.includes('Rate limited') ? 429 : 502;
      return NextResponse.json({ error: message }, { status });
    }

    const persistResult = await persistToSupabase(productId, parsed);

    return NextResponse.json({
      success: true,
      data: parsed,
      persisted: persistResult,
    });
  } catch (error) {
    console.error('EPD search error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
