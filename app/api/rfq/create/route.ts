import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create RFQ
    const { data: rfq, error } = await supabase
      .from('rfqs')
      .insert({
        architect_id: user.id,
        material_type: body.material_type,
        quantity: body.quantity,
        budget_range: body.budget_range,
        delivery_deadline: body.delivery_deadline,
        message: body.message,
        status: 'pending',
        material_specs: body.material_specs || {}
      })
      .select()
      .single();

    if (error) {
      console.error('RFQ creation error:', error);
      return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rfq });
  } catch (error) {
    console.error('RFQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
