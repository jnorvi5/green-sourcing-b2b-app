/**
 * Lead Detail API
 * 
 * GET /api/outreach/leads/[id] - Get single lead
 * PATCH /api/outreach/leads/[id] - Update lead
 * DELETE /api/outreach/leads/[id] - Delete lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../../models/Lead';
import {
  UpdateLeadRequest,
  UpdateLeadResponse,
  LeadStatus,
  LeadType,
  LeadPriority,
  ILead,
} from '../../../../../types/outreach';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/outreach/leads/[id]
 * Get single lead details
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: boolean; lead?: ILead; error?: string }>> {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const Lead = await getLeadModel();
    const lead = await Lead.findById(id).lean();

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: lead as unknown as ILead,
    });

  } catch (error) {
    console.error('Get lead error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/outreach/leads/[id]
 * Update lead
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<UpdateLeadResponse>> {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json() as UpdateLeadRequest;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const Lead = await getLeadModel();
    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.companyName !== undefined) lead.companyName = body.companyName.trim();
    if (body.contactName !== undefined) lead.contactName = body.contactName.trim();
    if (body.role !== undefined) lead.role = body.role.trim();
    if (body.phone !== undefined) lead.phone = body.phone?.trim();
    if (body.website !== undefined) lead.website = body.website?.trim();
    if (body.source !== undefined) lead.source = body.source.trim();
    if (body.notes !== undefined) lead.notes = body.notes;
    if (body.tags !== undefined) lead.tags = body.tags;

    // Validate and update email (check uniqueness)
    if (body.email !== undefined) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      const existingLead = await Lead.findOne({ 
        email: body.email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingLead) {
        return NextResponse.json(
          { success: false, error: 'A lead with this email already exists' },
          { status: 409 }
        );
      }
      lead.email = body.email.toLowerCase().trim();
    }

    // Validate and update enums
    if (body.leadType !== undefined) {
      if (!Object.values(LeadType).includes(body.leadType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid leadType' },
          { status: 400 }
        );
      }
      lead.leadType = body.leadType;
    }

    if (body.status !== undefined) {
      if (!Object.values(LeadStatus).includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      lead.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!Object.values(LeadPriority).includes(body.priority)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority' },
          { status: 400 }
        );
      }
      lead.priority = body.priority;
    }

    // Update context
    if (body.context !== undefined) {
      lead.context = { ...lead.context, ...body.context };
    }

    // Update follow-up settings
    if (body.autoFollowUpEnabled !== undefined) {
      lead.autoFollowUpEnabled = body.autoFollowUpEnabled;
    }

    if (body.nextFollowUpAt !== undefined) {
      lead.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined;
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      lead: lead.toObject() as unknown as ILead,
    });

  } catch (error) {
    console.error('Update lead error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/outreach/leads/[id]
 * Delete lead
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const Lead = await getLeadModel();
    const result = await Lead.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete lead error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
