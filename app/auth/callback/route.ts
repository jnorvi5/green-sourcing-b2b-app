import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If next param is present, redirect there
  if (next) {
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  // Get user to check role and redirect appropriately
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user?.user_metadata?.['role'] === 'supplier') {
    return NextResponse.redirect(`${requestUrl.origin}/supplier/dashboard`)
  } else if (user?.user_metadata?.['role'] === 'architect') {
    return NextResponse.redirect(`${requestUrl.origin}/architect/portal`)
  }
  
  // Default redirect to onboarding if role not set
  return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
}
