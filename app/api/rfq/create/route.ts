import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { RFQFormData, RFQCreateResponse } from '@/types/rfq';

/**
 * POST /api/rfq/create
 * Creates a new RFQ from an architect
 */
export async function POST(request: NextRequest): Promise<NextResponse<RFQCreateResponse>> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: RFQFormData = await request.json();
    
    // Validate required fields
    if (!body.project_name || !body.project_description || !body.material_category ||
        !body.quantity || !body.unit || !body.deadline || !body.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate quantity is positive
    if (body.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(body.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      return NextResponse.json(
        { success: false, error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }

    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'architect') {
      return NextResponse.json(
        { success: false, error: 'Only architects can create RFQs' },
        { status: 403 }
      );
    }

    // Insert RFQ into database
    // Note: The database schema uses different column names (BuyerID, ProjectName, etc.)
    // We need to map our form data to the database schema
    const { data: rfq, error: insertError } = await supabase
      .from('rfqs')
      .insert({
        architect_id: user.id,
        project_name: body.project_name,
        message: body.project_description,
        quantity_needed: body.quantity,
        unit: body.unit,
        budget_range: body.budget_range || null,
        deadline_date: body.deadline,
        location: body.location,
        material_category: body.material_category,
        status: 'Pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create RFQ. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        rfq_id: rfq.id,
        message: 'RFQ created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating RFQ:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
