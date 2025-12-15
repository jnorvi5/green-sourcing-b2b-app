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

// Type for matched product with nested supplier data
type MatchedProduct = {
  id: string;
  supplier_id: string;
  material_type: string;
  suppliers: {
    id: string;
    company_name: string;
    user_id: string;
    users: {
      id: string;
      email: string;
    }[];
  }[];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_name, last_name, company_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.role !== 'architect' && profile.role !== 'buyer') {
      return NextResponse.json({ error: 'Only architects can create RFQs' }, { status: 403 });
    }

    // Insert RFQ
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
      return NextResponse.json({ error: 'Failed to create RFQ', details: rfqError?.message }, { status: 500 });
    }

    // Find matching suppliers
    const materialType = rfqData.material_specs.material_type;
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
    }

    // Deduplicate suppliers (one supplier may have multiple products)
    const uniqueSuppliers = matchingProducts
      ? Array.from(
        new Map(
          (matchingProducts as MatchedProduct[]).map(p => [
            p.supplier_id,
            {
              supplier_id: p.supplier_id,
              company_name: p.suppliers[0]?.company_name,
              user_id: p.suppliers[0]?.user_id,
              email: p.suppliers[0]?.users[0]?.email,
            }
          ])
        ).values()
      )
      : [];

    console.log('[RFQ] Found', uniqueSuppliers.length, 'matching suppliers');

    // Create rfq_matches records and send notifications
    const matchPromises = uniqueSuppliers.map(async (supplier) => {
      try {
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
            await supabase
              .from('rfq_matches')
              .update({
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
                notification_email: supplier.email,
              })
              .eq('id', match.id);
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

    // Update RFQ with matched supplier IDs
    if (successfulMatches.length > 0) {
      const matchedSupplierIds = successfulMatches.map(m => m!.supplier_id);
      await supabase
        .from('rfqs')
        .update({ matched_suppliers: matchedSupplierIds })
        .eq('id', rfq.id);
    }

    return NextResponse.json({
        success: true,
        rfq_id: rfq.id,
        matched_suppliers_count: successfulMatches.length,
        message: 'RFQ created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[RFQ] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
