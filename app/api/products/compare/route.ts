
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid productIds' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        suppliers (
          name
        )
      `)
      .in('id', productIds);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: products });

  } catch (err: any) {
    console.error('Compare API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
