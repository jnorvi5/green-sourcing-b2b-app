import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const rfqSchema = z.object({
  supplier_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  delivery_date: z.string().optional(), // ISO date string
  project_name: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You must be logged in to create an RFQ' },
        { status: 401 }
      );
    }

    // 2. Validate Request Body
    const body = await request.json();
    const validationResult = rfqSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      supplier_id,
      product_id,
      quantity,
      delivery_date,
      project_name,
      notes
    } = validationResult.data;

    // 3. Insert into DB
    const { data: rfq, error: dbError } = await supabase
      .from('rfq_requests')
      .insert({
        buyer_id: user.id,
        supplier_id,
        product_id,
        quantity,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        project_name,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
      return NextResponse.json(
        { error: 'Database Error', details: 'Failed to create RFQ' },
        { status: 500 }
      );
    }

    // 4. Trigger Notification (Task 2 placeholder)
    // For Task 1, we just ensure the flow works.
    // In Task 2, we will integrate the actual email sending here.
    console.log(`[RFQ Created] ID: ${rfq.id}, Triggering notification for supplier ${supplier_id}`);

    return NextResponse.json({
      success: true,
      message: 'RFQ created successfully',
      data: rfq
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
