import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const FROM_EMAIL = process.env['RESEND_FROM_EMAIL'] || 'welcome@greenchainz.com';
const DASHBOARD_URL = process.env['NEXT_PUBLIC_BASE_URL']
  ? `${process.env['NEXT_PUBLIC_BASE_URL']}/supplier/dashboard`
  : 'https://greenchainz.com/supplier/dashboard';
const RFQ_URL = process.env['NEXT_PUBLIC_BASE_URL']
  ? `${process.env['NEXT_PUBLIC_BASE_URL']}/architect/dashboard`
  : 'https://greenchainz.com/architect/dashboard';

interface SupabaseUserPayload {
  id?: string;
  email?: string;
  role?: string;
}

function assertResend() {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  scheduledAt?: string;
}) {
  assertResend();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `GreenChainz <${FROM_EMAIL}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.scheduledAt ? { scheduled_at: opts.scheduledAt } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log('Email sent:', data);
  return data;
}

function supplierHtml(name: string, ctaUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif; color:#111;">
    <h2>Welcome to GreenChainz!</h2>
    <p>Hi ${name || 'there'}, thanks for joining as a supplier.</p>
    <p>To get verified faster:
      <ul>
        <li>Upload certifications (EPDs, FSC, LEED)</li>
        <li>Add products with sustainability data</li>
        <li>Complete your company profile</li>
      </ul>
    </p>
    <p>
      <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:6px;">Go to Supplier Dashboard</a>
    </p>
    <p>We’ll review your submissions and help you land your first RFQ.</p>
  </div>`;
}

function supplierFollowUp(day: number, ctaUrl: string) {
  if (day === 2) {
    return {
      subject: "Don't forget to upload your certifications",
      html: `<div style="font-family:Arial,sans-serif;color:#111;">
        <h3>Upload your certifications</h3>
        <p>Verified suppliers get prioritized. Add your EPDs and certifications now.</p>
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:6px;">Upload Certifications</a>
      </div>`
    };
  }
  return {
    subject: 'Tips for getting your first RFQ match',
    html: `<div style="font-family:Arial,sans-serif;color:#111;">
      <h3>Get your first RFQ</h3>
      <ul>
        <li>Add clear product descriptions and images</li>
        <li>Include carbon footprint and certifications</li>
        <li>Respond quickly to inbound RFQs</li>
      </ul>
      <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:white;text-decoration:none;border-radius:6px;">Improve My Listing</a>
    </div>`
  };
}

function architectHtml(name: string, ctaUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif; color:#111;">
    <h2>Welcome to GreenChainz!</h2>
    <p>Hi ${name || 'there'}, find verified sustainable suppliers in minutes.</p>
    <p>Create an RFQ, compare responses, and work with verified partners.</p>
    <p>
      <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">Create Your First RFQ</a>
    </p>
  </div>`;
}

function scheduleDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SupabaseUserPayload;
    const { id, email, role } = payload;
    if (!email) return NextResponse.json({ ok: true, note: 'missing email' }, { status: 200 });

    if (role === 'supplier') {
      await sendResendEmail({
        to: email,
        subject: 'Welcome to GreenChainz - Complete Your Profile',
        html: supplierHtml(email, DASHBOARD_URL),
      });
      await sendResendEmail({
        to: email,
        subject: supplierFollowUp(2, DASHBOARD_URL).subject,
        html: supplierFollowUp(2, DASHBOARD_URL).html,
        scheduledAt: scheduleDate(2),
      });
      await sendResendEmail({
        to: email,
        subject: supplierFollowUp(7, DASHBOARD_URL).subject,
        html: supplierFollowUp(7, DASHBOARD_URL).html,
        scheduledAt: scheduleDate(7),
      });
    } else if (role === 'architect' || role === 'buyer') {
      await sendResendEmail({
        to: email,
        subject: 'Welcome to GreenChainz - Find Verified Sustainable Suppliers',
        html: architectHtml(email, RFQ_URL),
      });
    } else {
      console.log('User role not handled; skipping email', { id, email, role });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Signup webhook error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 200 }); // return 200 to not retry endlessly
  }
}
