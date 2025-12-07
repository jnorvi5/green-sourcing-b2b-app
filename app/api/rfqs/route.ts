/**
 * RFQ Creation API Route
 * POST /api/rfqs - Create a new RFQ with supplier matching and notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendRfqNotificationEmail } from '@/lib/email/resend';

// Validation schema for RFQ creation
const createRfqSchema = z.object({
  project_name: z.string().min(1, 'Project name is required').max(200),
  project_location: z.string().min(1, 'Project location is required').max(200),
  material_specs: z.object({
    material_type: z.enum([
      'insulation',
      'flooring',
      'cladding',
      'roofing',
      'structural',
      'glazing',
      'finishes',
      'hvac',
      'plumbing',
      'electrical',
      'other'
    ], { required_error: 'Material type is required' }),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
  }),
  budget_range: z.string().optional(),
  delivery_deadline: z.string().datetime().optional().nullable(),
  required_certifications: z.array(z.string()).optional(),
  message: z.string().max(2000).optional(),
  product_id: z.string().uuid().optional().nullable(),
});

type CreateRfqInput = z.infer<typeof createRfqSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = createRfqSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const rfqData: CreateRfqInput = validationResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[RFQ] Authentication error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_name, last_name, company_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[RFQ] Profile fetch error:', profileError?.message);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Verify user has architect role
    if (profile.role !== 'architect') {
      console.error('[RFQ] Access denied - user role:', profile.role);
      return NextResponse.json(
        { error: 'Only architects can create RFQs' },
        { status: 403 }
      );
    }

    // Insert RFQ into database
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .insert({
        architect_id: user.id,
        product_id: rfqData.product_id || null,
        project_name: rfqData.project_name,
        project_location: rfqData.project_location,
        material_specs: rfqData.material_specs,
        budget_range: rfqData.budget_range,
        delivery_deadline: rfqData.delivery_deadline,
        required_certifications: rfqData.required_certifications || [],
        message: rfqData.message,
        status: 'pending',
      })
      .select('id, project_name, project_location, material_specs, budget_range, delivery_deadline, message')
      .single();

    if (rfqError || !rfq) {
      console.error('[RFQ] Insert error:', rfqError?.message);
      return NextResponse.json(
        { error: 'Failed to create RFQ', details: rfqError?.message },
        { status: 500 }
      );
    }

    console.log('[RFQ] Created RFQ:', rfq.id);

    // Auto-match suppliers based on material_type
    const materialType = rfqData.material_specs.material_type;
    
    // Find suppliers who have products matching the material type
    const { data: matchingProducts, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        supplier_id,
        material_type,
        suppliers!inner (
          id,
          company_name,
          user_id,
          users!inner (
            id,
            email
          )
        )
      `)
      .eq('material_type', materialType);

    if (productsError) {
      console.error('[RFQ] Product match error:', productsError.message);
      // Continue even if matching fails - RFQ is already created
    }

    // Deduplicate suppliers (one supplier may have multiple products)
    const uniqueSuppliers = matchingProducts
      ? Array.from(
          new Map(
            matchingProducts.map(p => [
              p.supplier_id,
              {
                supplier_id: p.supplier_id,
                company_name: (p.suppliers as any).company_name,
                user_id: (p.suppliers as any).user_id,
                email: (p.suppliers as any).users?.email,
              }
            ])
          ).values()
        )
      : [];

    console.log('[RFQ] Found', uniqueSuppliers.length, 'matching suppliers');

    // Create rfq_matches records and send notifications
    const matchPromises = uniqueSuppliers.map(async (supplier) => {
      try {
        // Determine match score (100 for exact match since we're filtering by material_type)
        const matchScore = 100;
        const matchReason = `Exact match: Supplier offers products in category "${materialType}"`;

        // Insert rfq_match record
        const { data: match, error: matchError } = await supabase
          .from('rfq_matches')
          .insert({
            rfq_id: rfq.id,
            supplier_id: supplier.supplier_id,
            match_score: matchScore,
            match_reason: matchReason,
            notification_sent: false,
          })
          .select()
          .single();

        if (matchError) {
          console.error('[RFQ] Match insert error for supplier', supplier.supplier_id, ':', matchError.message);
          return null;
        }

        // Send notification email
        if (supplier.email && match) {
          const architectName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : undefined;

          const emailResult = await sendRfqNotificationEmail({
            supplierName: supplier.company_name,
            supplierEmail: supplier.email,
            projectName: rfq.project_name,
            materialType: materialType,
            quantity: rfqData.material_specs.quantity,
            unit: rfqData.material_specs.unit,
            budgetRange: rfq.budget_range || undefined,
            deliveryDeadline: rfq.delivery_deadline || undefined,
            location: rfq.project_location,
            message: rfq.message || undefined,
            rfqId: rfq.id,
            architectName,
            companyName: profile.company_name || undefined,
          });

          if (emailResult.success) {
            // Update match record with notification status
            await supabase
              .from('rfq_matches')
              .update({
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
                notification_email: supplier.email,
              })
              .eq('id', match.id);

            console.log('[RFQ] Notification sent to', supplier.email, 'for match', match.id);
          } else {
            console.error('[RFQ] Notification failed for', supplier.email, ':', emailResult.error);
          }
        }

        return match;
      } catch (error) {
        console.error('[RFQ] Error processing match for supplier', supplier.supplier_id, ':', error);
        return null;
      }
    });

    // Wait for all matches and notifications to complete
    const matches = await Promise.all(matchPromises);
    const successfulMatches = matches.filter(m => m !== null);

    console.log('[RFQ] Created', successfulMatches.length, 'matches for RFQ', rfq.id);

    // Update RFQ with matched supplier IDs
    if (successfulMatches.length > 0) {
      const matchedSupplierIds = successfulMatches.map(m => m!.supplier_id);
      await supabase
        .from('rfqs')
        .update({ matched_suppliers: matchedSupplierIds })
        .eq('id', rfq.id);
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        rfq_id: rfq.id,
        matched_suppliers_count: successfulMatches.length,
        message: `RFQ created successfully. Matched with ${successfulMatches.length} supplier(s).`,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[RFQ] Unexpected error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
