
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const material_type = searchParams.get('material_type');
    const certifications = searchParams.get('certifications'); // Comma separated
    const sort = searchParams.get('sort') || 'created_at';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Sustainability filters
    // Expecting numerical values for filters
    const max_gwp = searchParams.get('max_gwp');
    const min_recycled_content = searchParams.get('min_recycled_content');

    const supabase = await createClient();

    let query = supabase.from('products').select('*', { count: 'exact' });

    // Keyword search
    if (q) {
      // or using text search if configured, but for now ilike on name/description
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Filters
    if (material_type) {
      query = query.eq('material_type', material_type);
    }

    if (certifications) {
      const certList = certifications.split(',').map(c => c.trim());
      // Filter products where certifications array contains ALL of the requested certs?
      // Or ANY? Usually filters are restrictive, so contains (array subset).
      // But query params usually imply intersection if multiple are selected in UI.
      // supabase .contains('certifications', ['LEED', 'FSC'])
      query = query.contains('certifications', certList);
    }

    // JSONB Filters
    // Note: Assuming sustainability_data has keys 'gwp' and 'recycled_content'
    // and they are numbers.
    // Casting might be needed depending on how data is stored.
    // .lte('sustainability_data->gwp', max_gwp) - this compares as json/text if not careful?
    // Postgres JSONB comparison works if the value in JSON is a number.

    if (max_gwp) {
      const maxGwpVal = parseFloat(max_gwp);
      if (!isNaN(maxGwpVal)) {
        // We cast the parameter to a number for the query comparison.
        // Supabase/PostgREST will try to compare this value.
        // However, 'sustainability_data->gwp' extracts as JSON (which includes type).
        // If the value in DB is a number, we should compare with a number.
        query = query.lte('sustainability_data->gwp', maxGwpVal);
      }
    }

    if (min_recycled_content) {
      const minRecycledVal = parseFloat(min_recycled_content);
      if (!isNaN(minRecycledVal)) {
        query = query.gte('sustainability_data->recycled_content_percent', minRecycledVal);
      }
    }

    // Sorting
    // Assuming sort is valid column or json field?
    // For MVP, allow sorting by created_at, name.
    if (['created_at', 'name'].includes(sort)) {
       query = query.order(sort, { ascending: sort === 'name' }); // Default desc for created_at usually?
    } else if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total: count,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });

  } catch (err: any) {
    console.error('Search API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
