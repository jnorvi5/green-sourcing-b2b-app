import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    // Get user to check role and redirect appropriately
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check user type from metadata or database
      const userType = user.user_metadata?.user_type || user.user_metadata?.role;
      
      if (userType === 'supplier') {
        return NextResponse.redirect(`${requestUrl.origin}/supplier/dashboard`);
      } else if (userType === 'architect' || userType === 'buyer') {
        return NextResponse.redirect(`${requestUrl.origin}/architect/dashboard`);
      }
      
      // Default redirect
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // No code or error
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
