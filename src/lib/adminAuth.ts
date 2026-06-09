import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export function getAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD || '';
  const salt = process.env.JWT_SECRET || 'mentora';
  return createHash('sha256').update(secret + salt).digest('hex');
}

export function checkAdminAuth(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_token')?.value;
  return !!cookie && cookie === getAdminToken();
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
