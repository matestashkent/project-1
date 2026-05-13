import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.APP_SECRET ?? 'dev-secret-change-in-prod';

export function createSessionToken(telegramId: string): string {
  const ts = Date.now().toString();
  const payload = `${telegramId}:${ts}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const firstColon = decoded.indexOf(':');
    const lastColon = decoded.lastIndexOf(':');
    if (firstColon === lastColon) return null;

    const telegramId = decoded.slice(0, firstColon);
    const ts = decoded.slice(firstColon + 1, lastColon);
    const sig = decoded.slice(lastColon + 1);

    if (Date.now() - parseInt(ts) > 30 * 24 * 60 * 60 * 1000) return null;

    const payload = `${telegramId}:${ts}`;
    const expected = createHmac('sha256', SECRET).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

    return telegramId;
  } catch {
    return null;
  }
}

export type AuthSuccess = { telegramId: string };

export function requireAuth(req: NextRequest): AuthSuccess | NextResponse {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const telegramId = verifySessionToken(auth.slice(7));
  if (!telegramId) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  return { telegramId };
}

export function isAuthError(result: AuthSuccess | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
