import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth, adminUnauthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!checkAdminAuth(request)) return adminUnauthorized();
  const { id } = await context.params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!checkAdminAuth(request)) return adminUnauthorized();
  const { id } = await context.params;
  const { action, days } = await request.json() as { action: 'grant' | 'revoke'; days?: number };

  if (action === 'revoke') {
    await prisma.subscription.updateMany({
      where: { userId: id, status: 'active' },
      data: { status: 'cancelled' },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'grant') {
    const daysToAdd = days || 30;
    const expiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    await prisma.subscription.updateMany({
      where: { userId: id, status: 'active' },
      data: { status: 'cancelled' },
    });
    await prisma.subscription.create({
      data: { userId: id, plan: 'pro', status: 'active', startedAt: new Date(), expiresAt },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
