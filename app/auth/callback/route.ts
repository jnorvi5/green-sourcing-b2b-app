import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Get user to check role and redirect appropriately
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user?.user_metadata?.role === 'supplier') {
    return NextResponse.redirect(`${requestUrl.origin}/supplier/dashboard`)
  } else if (user?.user_metadata?.role === 'architect') {
    return NextResponse.redirect(`${requestUrl.origin}/architect/portal`)
  }
  
  // Default redirect to onboarding if role not set
  return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
}
