import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Only attempt to send if API key is present
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Skipping admin notification email.');
      return NextResponse.json({ success: true, message: 'Email skipped (no API key)' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'; // Default or from env

    const { data, error } = await resend.emails.send({
      from: 'GreenChainz <onboarding@resend.dev>', // Update with your verified domain
      to: adminEmail,
      subject: 'New User Signed Up!',
      html: `
        <h1>New User Sign-up</h1>
        <p>A new user has signed up for GreenChainz.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Please check the Supabase dashboard for more details.</p>
      `,
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error in notify-admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
