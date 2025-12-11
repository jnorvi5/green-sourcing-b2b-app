import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('users').select('count').limit(1);
    
    // Check MongoDB connection
    let mongoStatus = 'not configured';
    if (process.env['MONGODB_URI']) {
      try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env['MONGODB_URI']);
        await client.connect();
        await client.db().admin().ping();
        await client.close();
        mongoStatus = 'connected';
      } catch (error) {
        mongoStatus = 'error';
      }
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: dbError ? 'error' : 'connected',
        mongodb: mongoStatus,
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
