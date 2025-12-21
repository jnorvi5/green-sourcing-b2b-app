import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailTemplateType } from '../../../../lib/email/emailService';

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, template, data, subject } = body;

    // Validate required fields
    if (!to || !template || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: to, template, data' },
        { status: 400 }
      );
    }

    // Validate template type (basic check)
    const validTemplates: EmailTemplateType[] = [
      'RFQ_RECEIVED',
      'QUOTE_SUBMITTED',
      'QUOTE_ACCEPTED',
      'WELCOME_EMAIL',
      'AUDIT_COMPLETE',
    ];

    if (!validTemplates.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendEmail(to, template as EmailTemplateType, data, { subject });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
