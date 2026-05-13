import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const telegramId = req.headers.get('x-telegram-id');
  if (!telegramId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        essays: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, taskType: true, overallBand: true, createdAt: true },
        },
        subscriptions: { where: { status: 'active' }, orderBy: { expiresAt: 'desc' }, take: 1 },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const task1Count = user.essays.filter(e => e.taskType === 'task1').length;
    const task2Count = user.essays.filter(e => e.taskType === 'task2').length;
    const recentEssays = [...user.essays]
      .reverse()
      .slice(0, 5)
      .map(e => ({ id: e.id, taskType: e.taskType, band: e.overallBand, date: e.createdAt }));

    return NextResponse.json({
      user: {
        ...user,
        telegramId: user.telegramId.toString(),
        writingBands: user.essays.map(e => ({ band: e.overallBand, date: e.createdAt })),
        subscription: user.subscriptions[0] ?? null,
        task1Count,
        task2Count,
        recentEssays,
      },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const telegramId = req.headers.get('x-telegram-id');
  if (!telegramId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, language, level, targetBand, examIn, studyMinutes, weakAreas } = body;

    const user = await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: {
        ...(name && { name }),
        ...(language && { language }),
        ...(level && { level }),
        ...(targetBand && { targetBand }),
        ...(examIn && { examIn }),
        ...(studyMinutes && { studyMinutes }),
        ...(weakAreas && { weakAreas }),
        lastActive: new Date(),
      },
    });

    return NextResponse.json({ user: { ...user, telegramId: user.telegramId.toString() } });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
