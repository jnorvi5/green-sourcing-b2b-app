
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = await createClient();

    // Fetch supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (supplierError) {
       if (supplierError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }
      return NextResponse.json({ error: supplierError.message }, { status: 500 });
    }

    // Fetch their products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', id);

    if (productsError) {
       return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        ...supplier,
        products
      }
    });

  } catch (err: any) {
    console.error('Supplier Profile API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
