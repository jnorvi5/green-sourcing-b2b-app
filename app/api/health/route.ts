import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - API routes should not be pre-rendered
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('users').select('count').limit(1);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: dbError ? 'error' : 'connected',
        intercom: process.env['NEXT_PUBLIC_INTERCOM_APP_ID'] ? 'configured' : 'not configured',
        email: process.env['RESEND_API_KEY'] ? 'configured' : 'not configured',
        storage: process.env['AWS_BUCKET_NAME'] ? 'configured' : 'not configured'
      },
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '0.1.0'
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
