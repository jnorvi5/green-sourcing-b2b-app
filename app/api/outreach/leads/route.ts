/**
 * Leads API
 * 
 * GET /api/outreach/leads - List leads with filters
 * POST /api/outreach/leads - Create a new lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel, ILeadDocument } from '../../../../models/Lead';
import {
  ListLeadsQuery,
  ListLeadsResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  LeadStatus,
  LeadType,
  LeadPriority,
} from '../../../../types/outreach';

export const dynamic = 'force-dynamic';

/**
 * GET /api/outreach/leads
 * List leads with optional filters and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse<ListLeadsResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: ListLeadsQuery = {
      status: searchParams.get('status') as LeadStatus | undefined,
      leadType: searchParams.get('leadType') as LeadType | undefined,
      priority: searchParams.get('priority') as LeadPriority | undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      search: searchParams.get('search') || undefined,
    };

    const Lead = await getLeadModel();

    // Build filter
    const filter: Record<string, unknown> = {};

    if (query.status && Object.values(LeadStatus).includes(query.status)) {
      filter.status = query.status;
    }

    if (query.leadType && Object.values(LeadType).includes(query.leadType)) {
      filter.leadType = query.leadType;
    }

    if (query.priority && Object.values(LeadPriority).includes(query.priority)) {
      filter.priority = query.priority;
    }

    // Text search
    if (query.search && query.search.length >= 2) {
      filter.$or = [
        { companyName: { $regex: query.search, $options: 'i' } },
        { contactName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // Execute queries
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      leads: leads as unknown as ListLeadsResponse['leads'],
      total,
      page,
      totalPages,
    });

  } catch (error) {
    console.error('List leads error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, leads: [], total: 0, page: 1, totalPages: 0, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/outreach/leads
 * Create a new lead
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateLeadResponse>> {
  try {
    const body = await request.json() as CreateLeadRequest;

    // Validate required fields
    const requiredFields = ['companyName', 'contactName', 'email', 'role', 'leadType', 'source'] as const;
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate leadType
    if (!Object.values(LeadType).includes(body.leadType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid leadType' },
        { status: 400 }
      );
    }

    const Lead = await getLeadModel();

    // Check for duplicate email
    const existingLead = await Lead.findOne({ email: body.email.toLowerCase() });
    if (existingLead) {
      return NextResponse.json(
        { success: false, error: 'A lead with this email already exists' },
        { status: 409 }
      );
    }

    // Create lead
    const leadData: Partial<ILeadDocument> = {
      companyName: body.companyName.trim(),
      contactName: body.contactName.trim(),
      email: body.email.toLowerCase().trim(),
      role: body.role.trim(),
      phone: body.phone?.trim(),
      website: body.website?.trim(),
      leadType: body.leadType,
      status: LeadStatus.NEW,
      source: body.source.trim(),
      priority: body.priority || LeadPriority.MEDIUM,
      tags: body.tags || [],
      notes: body.notes || '',
      context: body.context || {},
      autoFollowUpEnabled: body.autoFollowUpEnabled ?? false,
      emails: [],
      followUpCount: 0,
    };

    const lead = await Lead.create(leadData);

    return NextResponse.json({
      success: true,
      lead: lead.toObject() as unknown as CreateLeadResponse['lead'],
    }, { status: 201 });

  } catch (error) {
    console.error('Create lead error:', error);
    
    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A lead with this email already exists' },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
