/**
 * Send Outreach Email API
 * 
 * POST /api/outreach/send
 * Sends an approved email to a lead via Zoho SMTP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../models/Lead';
import { sendEmail } from '../../../../lib/zoho-smtp';
import {
  SendEmailRequest,
  SendEmailResponse,
  EmailStatus,
  LeadStatus,
} from '../../../../types/outreach';

export const dynamic = 'force-dynamic';

const DEFAULT_FOLLOW_UP_DAYS = parseInt(process.env.OUTREACH_AUTO_FOLLOW_UP_DAYS || '5', 10);

export async function POST(request: NextRequest): Promise<NextResponse<SendEmailResponse>> {
  try {
    const body = await request.json() as SendEmailRequest;

    // Validate request
    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    if (typeof body.emailIndex !== 'number' || body.emailIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid emailIndex is required' },
        { status: 400 }
      );
    }

    // Get lead from database
    const Lead = await getLeadModel();
    const lead = await Lead.findById(body.leadId);

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

    // Check if email is approved (or if sendNow is forcing immediate send)
    if (!body.sendNow && email?.status !== EmailStatus.APPROVED) {
      return NextResponse.json(
        { success: false, error: 'Email must be approved before sending' },
        { status: 400 }
      );
    }

    // Send email via Zoho SMTP
    const result = await sendEmail({
      to: lead.email,
      subject: email?.subject ?? '',
      text: email?.body ?? '',
      html: email?.htmlBody,
    });

    if (!result.success) {
      // Update email status to reflect failure
      if (email) {
        email.status = EmailStatus.BOUNCED;
      }
      await lead.save();

      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update email record
    if (email) {
      email.status = EmailStatus.SENT;
      email.sentAt = new Date();
      email.messageId = result.messageId;
    }

    // Update lead record
    lead.lastContactedAt = new Date();
    lead.followUpCount = (lead.followUpCount || 0) + 1;

    // Update status if this is the first contact
    if (lead.status === LeadStatus.NEW) {
      lead.status = LeadStatus.CONTACTED;
    }

    // Schedule next follow-up if enabled
    if (lead.autoFollowUpEnabled && lead.followUpCount < 4) {
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + DEFAULT_FOLLOW_UP_DAYS);
      lead.nextFollowUpAt = nextFollowUp;
    } else {
      lead.nextFollowUpAt = undefined;
    }

    await lead.save();

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Send email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
