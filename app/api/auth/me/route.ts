import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth/verify-role';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const payload = await verifyRole(req); // Check if logged in (any role)

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name, company_name, avatar_url, trust_score, corporate_verified')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
