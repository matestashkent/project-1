import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth, adminUnauthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return adminUnauthorized();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeToday, activeWeek, activeMonth, totalEssays, proUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActive: { gte: today } } }),
    prisma.user.count({ where: { lastActive: { gte: weekAgo } } }),
    prisma.user.count({ where: { lastActive: { gte: monthAgo } } }),
    prisma.essay.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
  ]);

  return NextResponse.json({ totalUsers, activeToday, activeWeek, activeMonth, totalEssays, proUsers });
}
