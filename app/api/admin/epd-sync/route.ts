import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { EPDInternationalClient, normalizeEPD } from '@/lib/integrations/epd-international';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. AUTHENTICATION FIRST (Security Best Practice)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. CHECK ROLE
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. API KEY CHECK (Now properly secured)
    const apiKey = process.env.EPD_INTERNATIONAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'EPD API key not configured' }, { status: 500 });
    }

    // 4. PARSE AND VALIDATE QUERY PARAMETERS
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    let limit: number | undefined;
    
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit <= 0) {
        return NextResponse.json({ error: 'Invalid limit parameter: must be a positive integer' }, { status: 400 });
      }
    }

    // 5. FETCH EPDs FROM API
    const client = new EPDInternationalClient({ apiKey });
    const rawEpds = await client.fetchAllEPDs({ limit });

    // 6. SYNC TO DATABASE
    if (rawEpds.length === 0) {
      return NextResponse.json({
        success: true,
        total_fetched: 0,
        new_inserts: 0,
        updates: 0,
        errors: ['No EPDs fetched from API'],
      });
    }

    let newInserts = 0;
    let updates = 0;
    const errors: string[] = [];

    for (const rawEpd of rawEpds) {
      try {
        // Normalize the EPD data
        const normalized = normalizeEPD(rawEpd as Record<string, unknown>);
        
        if (!normalized) {
          errors.push(`Invalid EPD data: missing required fields`);
          continue;
        }

        // Check if EPD already exists
        const { data: existing } = await supabase
          .from('epd_database')
          .select('*')
          .eq('epd_number', normalized.epd_number)
          .maybeSingle();

        if (existing) {
          // Check if data has changed
          const hasChanged = 
            existing.gwp_fossil_a1a3 !== normalized.gwp_fossil_a1a3 ||
            existing.recycled_content_pct !== normalized.recycled_content_pct ||
            JSON.stringify(existing.certifications) !== JSON.stringify(normalized.certifications);

          if (hasChanged) {
            // Update existing EPD
            await supabase
              .from('epd_database')
              .update({
                product_name: normalized.product_name,
                manufacturer: normalized.manufacturer,
                gwp_fossil_a1a3: normalized.gwp_fossil_a1a3,
                recycled_content_pct: normalized.recycled_content_pct,
                certifications: normalized.certifications,
                valid_from: normalized.valid_from,
                valid_until: normalized.valid_until,
                declared_unit: normalized.declared_unit,
                pcr_reference: normalized.pcr_reference,
                geographic_scope: normalized.geographic_scope,
                data_source: normalized.data_source,
                updated_at: new Date().toISOString(),
              })
              .eq('epd_number', normalized.epd_number);
            
            updates++;
          }
        } else {
          // Insert new EPD
          await supabase
            .from('epd_database')
            .insert({
              epd_number: normalized.epd_number,
              product_name: normalized.product_name,
              manufacturer: normalized.manufacturer,
              gwp_fossil_a1a3: normalized.gwp_fossil_a1a3,
              recycled_content_pct: normalized.recycled_content_pct,
              certifications: normalized.certifications,
              valid_from: normalized.valid_from,
              valid_until: normalized.valid_until,
              declared_unit: normalized.declared_unit,
              pcr_reference: normalized.pcr_reference,
              geographic_scope: normalized.geographic_scope,
              data_source: normalized.data_source,
            });
          
          newInserts++;
        }
      } catch (error: any) {
        errors.push(`Error processing EPD: ${error.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      total_fetched: rawEpds.length,
      new_inserts: newInserts,
      updates,
      errors,
    });

  } catch (error: any) {
    console.error("EPD Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
