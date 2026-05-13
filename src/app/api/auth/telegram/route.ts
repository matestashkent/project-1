import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/db';

function verifyTelegramData(initData: string, botToken: string): Record<string, string> | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const result: Record<string, string> = {};
  entries.forEach(([k, v]) => { result[k] = v; });
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    // In development without a bot token, allow direct profile creation
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    let telegramId: bigint;
    let firstName: string;

    if (botToken && initData) {
      const verified = verifyTelegramData(initData, botToken);
      if (!verified) return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });

      const user = JSON.parse(verified['user'] || '{}');
      telegramId = BigInt(user.id);
      firstName = user.first_name || 'Student';
    } else {
      // Dev fallback — will be removed in production
      return NextResponse.json({ error: 'No bot token configured' }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { lastActive: new Date() },
      create: { telegramId, name: firstName },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
