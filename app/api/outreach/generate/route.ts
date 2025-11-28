/**
 * Generate Outreach Email API
 * 
 * POST /api/outreach/generate
 * Generates a personalized outreach email using Azure AI for a specific lead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../models/Lead';
import { generateOutreachEmail } from '../../../../lib/azure-ai';
import {
  GenerateEmailRequest,
  GenerateEmailResponse,
  EmailType,
  EmailTone,
  EmailStatus,
} from '../../../../types/outreach';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<GenerateEmailResponse>> {
  try {
    const body = await request.json() as GenerateEmailRequest;

    // Validate request
    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    if (!body.emailType || !Object.values(EmailType).includes(body.emailType)) {
      return NextResponse.json(
        { success: false, error: 'Valid emailType is required (initial, follow_up_1, follow_up_2, follow_up_3)' },
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

    // Generate email using Azure AI
    const generatedEmail = await generateOutreachEmail({
      lead: {
        companyName: lead.companyName,
        contactName: lead.contactName,
        role: lead.role,
        leadType: lead.leadType,
        context: lead.context || {},
      },
      emailType: body.emailType,
      tone: body.tone || EmailTone.FRIENDLY,
    });

    // Save generated email to lead record
    lead.emails.push({
      subject: generatedEmail.subject,
      body: generatedEmail.body,
      htmlBody: generatedEmail.htmlBody,
      generatedAt: new Date(),
      status: EmailStatus.DRAFT,
      type: body.emailType,
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      email: {
        subject: generatedEmail.subject,
        body: generatedEmail.body,
        htmlBody: generatedEmail.htmlBody,
      },
    });

  } catch (error) {
    console.error('Generate email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
