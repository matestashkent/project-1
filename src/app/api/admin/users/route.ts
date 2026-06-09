import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminAuth, adminUnauthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return adminUnauthorized();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscriptions: { where: { status: 'active' }, take: 1 },
      _count: { select: { essays: true } },
    },
  });

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      telegramId: u.telegramId.toString(),
      name: u.name,
      level: u.level,
      targetBand: u.targetBand,
      streak: u.streak,
      lessonsCompleted: u.lessonsCompleted,
      writingSubmissions: u._count.essays,
      lastActive: u.lastActive,
      createdAt: u.createdAt,
      subscription: u.subscriptions[0]
        ? { plan: u.subscriptions[0].plan, expiresAt: u.subscriptions[0].expiresAt }
        : null,
    })),
  });
}
