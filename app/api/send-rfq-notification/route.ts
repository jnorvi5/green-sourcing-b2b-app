import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RfqPayload {
  supplierEmail?: string;
  architectName?: string;
  productName?: string;
  dashboardLink?: string;
  rfqId?: string;
}

function validate(payload: RfqPayload) {
  const missing = [] as string[];
  if (!payload.supplierEmail) missing.push('supplierEmail');
  if (!payload.productName) missing.push('productName');
  if (!payload.architectName) missing.push('architectName');
  if (!payload.dashboardLink) missing.push('dashboardLink');
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

async function sendEmailMock(payload: RfqPayload) {
  console.log('RFQ notification (mock):', payload);
  return { id: 'mock-email-id', provider: 'mock', status: 'sent' };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RfqPayload;
    validate(payload);

    // Choose provider; currently mocked to avoid failures without creds.
    const hasProvider = Boolean(process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.AWS_SES_ACCESS_KEY_ID);

    const result = hasProvider
      ? await sendEmailMock(payload) // Replace with real provider integration when creds are available
      : await sendEmailMock(payload);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send RFQ notification';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
