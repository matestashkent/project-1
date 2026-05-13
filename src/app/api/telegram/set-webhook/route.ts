import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!appUrl || !token) {
    return NextResponse.json({ error: 'Missing APP_URL or BOT_TOKEN in env' }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = await res.json();
  return NextResponse.json({ webhookUrl, result: data });
}
