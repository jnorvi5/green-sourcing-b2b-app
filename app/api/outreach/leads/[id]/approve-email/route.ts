/**
 * Approve Email API
 * 
 * POST /api/outreach/leads/[id]/approve-email
 * Approves an email for sending, optionally with edits.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../../../models/Lead';
import {
  ApproveEmailRequest,
  ApproveEmailResponse,
  EmailStatus,
} from '../../../../../../types/outreach';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApproveEmailResponse>> {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json() as ApproveEmailRequest;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (typeof body.emailIndex !== 'number' || body.emailIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid emailIndex is required' },
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

    // Validate email exists
    if (body.emailIndex >= lead.emails.length) {
      return NextResponse.json(
        { success: false, error: 'Email not found at specified index' },
        { status: 404 }
      );
    }

    const email = lead.emails[body.emailIndex];

    // Check email is in draft status
    if (email && email.status !== EmailStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: 'Only draft emails can be approved' },
        { status: 400 }
      );
    }

    // Apply edits if provided
    if (email) {
      if (body.editedSubject !== undefined) {
        email.subject = body.editedSubject;
      }
      if (body.editedBody !== undefined) {
        email.body = body.editedBody;
      }
      if (body.editedHtmlBody !== undefined) {
        email.htmlBody = body.editedHtmlBody;
      }

      // Update status to approved
      email.status = EmailStatus.APPROVED;
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      lead: lead.toObject() as unknown as ApproveEmailResponse['lead'],
    });

  } catch (error) {
    console.error('Approve email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
