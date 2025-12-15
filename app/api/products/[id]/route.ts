
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = await createClient();

    // Fetch product with supplier info
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        suppliers (
          id,
          name,
          location,
          logo_url,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // 0 rows
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (err: any) {
    console.error('Product Detail API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
