import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth/verify-role';

// Test endpoint to verify role middleware
export async function GET(req: NextRequest) {
  const payload = await verifyRole(req, ['admin', 'architect']);

  if (payload === null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (payload === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
      message: 'Access granted',
      user: payload
  });
}
