import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export type UserRole = 'architect' | 'supplier' | 'admin';

export async function verifyRole(req: NextRequest, requiredRole?: UserRole | UserRole[]) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(payload.role as UserRole)) {
      return false; // Valid token, wrong role
    }
  }

  return payload;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
