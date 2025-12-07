/**
 * Protected EPD International API Sync Route
 * POST /api/admin/epd-sync
 * 
 * Syncs EPD data from EPD International API into Supabase epd_database table.
 * Restricted to authenticated admin users only.
 * 
 * Features:
 * - Admin-only authentication
 * - Fetch EPDs from EPD International API with pagination
 * - Handle both ILCD/EPD XML and JSON responses
 * - Parse and normalize EPD data
 * - Upsert to Supabase (insert new, update changed)
 * - Support optional ?limit query param for testing
 * - Return summary of sync operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EPDInternationalClient, normalizeEPD } from '@/lib/integrations/epd-international';
import { type NormalizedEPD } from '@/lib/validations/epd-sync';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SyncSummary {
  total_fetched: number;
  new_inserts: number;
  updates: number;
  errors: string[];
}

/**
 * POST handler for EPD sync
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const errors: string[] = [];
  let total_fetched = 0;
  let new_inserts = 0;
  let updates = 0;

  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[EPD Sync] Authentication error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('[EPD Sync] Access denied - user role:', userData?.role);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('[EPD Sync] Admin user authenticated:', user.email);

    // 3. Get optional limit parameter for testing
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive integer.' },
        { status: 400 }
      );
    }

    console.log('[EPD Sync] Starting sync', limit ? `with limit of ${limit}` : '(no limit)');

    // 4. Check for API key
    const apiKey = process.env.EPD_INTERNATIONAL_API_KEY;
    if (!apiKey) {
      console.error('[EPD Sync] EPD_INTERNATIONAL_API_KEY not configured');
      return NextResponse.json(
        { error: 'EPD API key not configured' },
        { status: 500 }
      );
    }

    // 5. Initialize EPD client
    const epdClient = new EPDInternationalClient({
      apiKey,
    });

    // 6. Fetch EPDs from API
    console.log('[EPD Sync] Fetching EPDs from API...');
    const apiEPDs = await epdClient.fetchAllEPDs({ limit });
    total_fetched = apiEPDs.length;
    console.log(`[EPD Sync] Fetched ${total_fetched} EPDs from API`);

    if (total_fetched === 0) {
      return NextResponse.json({
        total_fetched: 0,
        new_inserts: 0,
        updates: 0,
        errors: ['No EPDs fetched from API'],
      });
    }

    // 7. Normalize EPD data
    console.log('[EPD Sync] Normalizing EPD data...');
    const normalizedEPDs: NormalizedEPD[] = [];
    
    for (const apiEPD of apiEPDs) {
      console.log('[EPD Sync] Processing EPD:', JSON.stringify(apiEPD).substring(0, 200));
      const normalized = normalizeEPD(apiEPD);
      if (normalized) {
        normalizedEPDs.push(normalized);
      } else {
        errors.push(`Failed to normalize EPD: ${apiEPD.epd_number || apiEPD.uuid || 'unknown'}`);
      }
    }

    console.log(`[EPD Sync] Normalized ${normalizedEPDs.length} EPDs`);

    // 8. Upsert EPDs to Supabase
    console.log('[EPD Sync] Upserting EPDs to database...');
    
    for (const epd of normalizedEPDs) {
      try {
        // Check if EPD exists
        const { data: existingEPD, error: fetchError } = await supabase
          .from('epd_database')
          .select('id, updated_at, gwp_fossil_a1a3, recycled_content_pct, certifications')
          .eq('epd_number', epd.epd_number)
          .maybeSingle();

        if (fetchError) {
          errors.push(`Error checking EPD ${epd.epd_number}: ${fetchError.message}`);
          continue;
        }

        if (existingEPD) {
          // Check if data has changed
          const hasChanged = 
            existingEPD.gwp_fossil_a1a3 !== epd.gwp_fossil_a1a3 ||
            existingEPD.recycled_content_pct !== epd.recycled_content_pct ||
            JSON.stringify(existingEPD.certifications) !== JSON.stringify(epd.certifications);

          if (hasChanged) {
            // Update existing EPD
            const { error: updateError } = await supabase
              .from('epd_database')
              .update({
                product_name: epd.product_name,
                manufacturer: epd.manufacturer,
                gwp_fossil_a1a3: epd.gwp_fossil_a1a3,
                recycled_content_pct: epd.recycled_content_pct,
                certifications: epd.certifications,
                valid_from: epd.valid_from,
                valid_until: epd.valid_until,
                declared_unit: epd.declared_unit,
                pcr_reference: epd.pcr_reference,
                geographic_scope: epd.geographic_scope,
                raw_data: epd.raw_data,
              })
              .eq('id', existingEPD.id);

            if (updateError) {
              errors.push(`Error updating EPD ${epd.epd_number}: ${updateError.message}`);
            } else {
              updates++;
              console.log(`[EPD Sync] Updated EPD: ${epd.epd_number}`);
            }
          }
        } else {
          // Insert new EPD
          const { error: insertError } = await supabase
            .from('epd_database')
            .insert({
              epd_number: epd.epd_number,
              product_name: epd.product_name,
              manufacturer: epd.manufacturer,
              gwp_fossil_a1a3: epd.gwp_fossil_a1a3,
              recycled_content_pct: epd.recycled_content_pct,
              certifications: epd.certifications,
              valid_from: epd.valid_from,
              valid_until: epd.valid_until,
              declared_unit: epd.declared_unit,
              pcr_reference: epd.pcr_reference,
              geographic_scope: epd.geographic_scope,
              data_source: epd.data_source,
              raw_data: epd.raw_data,
            });

          if (insertError) {
            errors.push(`Error inserting EPD ${epd.epd_number}: ${insertError.message}`);
          } else {
            new_inserts++;
            console.log(`[EPD Sync] Inserted new EPD: ${epd.epd_number}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Unexpected error processing EPD ${epd.epd_number}: ${errorMsg}`);
      }
    }

    // 9. Return summary
    const duration = Date.now() - startTime;
    console.log(`[EPD Sync] Completed in ${duration}ms - Fetched: ${total_fetched}, Inserted: ${new_inserts}, Updated: ${updates}, Errors: ${errors.length}`);

    const summary: SyncSummary = {
      total_fetched,
      new_inserts,
      updates,
      errors,
    };

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[EPD Sync] Fatal error:', error);

    return NextResponse.json(
      {
        total_fetched,
        new_inserts,
        updates,
        errors: [...errors, `Fatal error: ${errorMsg}`],
      },
      { status: 500 }
    );
  }
}
