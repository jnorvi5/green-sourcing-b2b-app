import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase
      .from('email_subscribers')
      .insert({ 
        email, 
        source: source || 'homepage',
        subscribed_at: new Date().toISOString() 
      });

    if (error && error.code !== '23505') { // Ignore duplicate email errors
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Email subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}