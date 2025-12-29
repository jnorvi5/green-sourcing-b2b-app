
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // 1. Safe Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Safe Profile Fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Guard against profile being missing
    if (profileError || !profile) {
       console.error("Profile missing for user:", user.id);
       return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Now it is safe to check roles
    if (profile.role !== 'buyer' && profile.role !== 'admin') {
       // If logic allows suppliers, change this check
    }

    // ... Rest of your logic fetching RFQs ...
    
    // Mock return to pass build if DB is empty
    return NextResponse.json({ success: true, rfqs: [] });

  } catch (error: any) {
    console.error('RFQ Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
