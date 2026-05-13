import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioToR2 } from '@/lib/r2';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_TTS_LENGTH = 5000;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`tts:${telegramId}`, 10)) {
    return NextResponse.json({ error: 'Лимит аудио на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { text, cacheId } = (await request.json()) as { text: string; cacheId?: string };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (cacheId) {
      const existing = await prisma.listeningCache.findUnique({
        where: { id: cacheId },
        select: { audioUrl: true },
      });
      if (existing?.audioUrl) {
        return NextResponse.json({ audioUrl: existing.audioUrl, fromCache: true });
      }
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const trimmedText = text.slice(0, MAX_TTS_LENGTH);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
        }),
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs error:', response.status);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    const key = `listening/${cacheId || Date.now()}.mp3`;
    const audioUrl = await uploadAudioToR2(key, audioBuffer);

    if (cacheId) {
      await prisma.listeningCache.update({ where: { id: cacheId }, data: { audioUrl } });
    }

    return NextResponse.json({ audioUrl, fromCache: false });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
