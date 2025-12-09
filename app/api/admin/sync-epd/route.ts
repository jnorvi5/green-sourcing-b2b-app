import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for fetch and processing

const EPD_API_URL = 'https://epd-apim.developer.azure-api.net/api/epds';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase Admin Client (Service Role) inside handler to avoid build-time errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const API_KEY = process.env.EPD_INTERNATIONAL_API_KEY;
    // 1. Check Authentication & Admin Role
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin (assuming 'role' in metadata or a profiles table check)
    // For this implementation, we'll check the 'role' claim or query the profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      // Fallback: check app_metadata if role is stored there
      if (user.app_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
      }
    }

    // 2. Parse Query Params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: Missing EPD API Key' }, { status: 500 });
    }

    // 3. Fetch EPDs
    let fetchedCount = 0;
    let newInserts = 0;
    let updates = 0;
    const errors: any[] = [];
    
    // Pagination loop
    let page = 1;
    const pageSize = 50; // Default page size for the external API
    let hasMore = true;

    while (hasMore && fetchedCount < limit) {
      const fetchUrl = `${EPD_API_URL}?pageNumber=${page}&pageSize=${pageSize}`;
      
      console.log(`Fetching EPDs from: ${fetchUrl}`);
      
      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json', // Prefer JSON
        },
      });

      if (!response.ok) {
        throw new Error(`EPD API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.data || data.items || (Array.isArray(data) ? data : []);

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // 4. Process Items
      for (const item of items) {
        if (fetchedCount >= limit) break;

        try {
          // Extract fields (adjusting for potential API response structure)
          const epdNumber = item.registrationNumber || item.epd_number || item.uuid;
          
          if (!epdNumber) {
            console.warn('Skipping item without EPD number', item);
            continue;
          }

          const record = {
            epd_number: epdNumber,
            product_name: item.productName || item.name,
            manufacturer: item.manufacturer || item.company,
            // Try to find GWP in common locations
            gwp_fossil_a1a3: item.gwp?.a1a3 ?? item.indicators?.gwp_fossil ?? null,
            recycled_content_pct: item.recycledContent ?? null,
            certifications: item.certifications || [],
            valid_from: item.validFrom ? new Date(item.validFrom) : null,
            valid_until: item.validUntil ? new Date(item.validUntil) : null,
            raw_data: item,
            source: 'EPD International',
            last_synced_at: new Date().toISOString(),
          };

          // 5. Upsert to Supabase
          const { data: existing } = await supabaseAdmin
            .from('epd_database')
            .select('id')
            .eq('epd_number', epdNumber)
            .single();

          const { error: upsertError } = await supabaseAdmin
            .from('epd_database')
            .upsert(record, { onConflict: 'epd_number' });

          if (upsertError) {
            errors.push({ epd: epdNumber, error: upsertError.message });
          } else {
            if (existing) updates++;
            else newInserts++;
          }

          fetchedCount++;

        } catch (err: any) {
          errors.push({ item_index: fetchedCount, error: err.message });
        }
      }

      // Check pagination
      if (items.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_fetched: fetchedCount,
        new_inserts: newInserts,
        updates: updates,
        errors_count: errors.length,
        errors: errors.slice(0, 10), // Return first 10 errors to avoid huge payload
      }
    });

  } catch (error: any) {
    console.error('Sync EPD Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
