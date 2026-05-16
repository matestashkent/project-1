import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioToR2 } from '@/lib/r2';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_TTS_LENGTH = 4000;
const MAX_SEGMENT_LENGTH = 800;

type Segment = { speaker: 'A' | 'B' | 'mono'; text: string };

function parsePassage(text: string): Segment[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const segments: Segment[] = [];

  for (const line of lines) {
    const matchA = line.match(/^Speaker\s*A\s*:\s*(.+)/i);
    const matchB = line.match(/^Speaker\s*B\s*:\s*(.+)/i);
    if (matchA && matchA[1].trim()) {
      segments.push({ speaker: 'A', text: matchA[1].trim().slice(0, MAX_SEGMENT_LENGTH) });
    } else if (matchB && matchB[1].trim()) {
      segments.push({ speaker: 'B', text: matchB[1].trim().slice(0, MAX_SEGMENT_LENGTH) });
    } else if (!line.match(/^Speaker\s*[AB]\s*:/i)) {
      segments.push({ speaker: 'mono', text: line.slice(0, MAX_SEGMENT_LENGTH) });
    }
  }

  const isDialogue = segments.some(s => s.speaker === 'A' || s.speaker === 'B');
  if (!isDialogue) {
    return [{ speaker: 'mono', text: text.slice(0, MAX_TTS_LENGTH) }];
  }
  return segments.filter(s => s.text.length > 0);
}

async function generateSegment(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Generate segments sequentially to avoid ElevenLabs rate limits
async function generateSequential(segments: Segment[], voiceIdA: string, voiceIdB: string, apiKey: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for (const seg of segments) {
    const voiceId = seg.speaker === 'B' ? voiceIdB : voiceIdA;
    const buf = await generateSegment(seg.text, voiceId, apiKey);
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`tts:${telegramId}`, 25)) {
    return NextResponse.json({ error: 'Лимит аудио на этот час исчерпан. Попробуй через час.' }, { status: 429 });
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
    const voiceIdA = process.env.ELEVENLABS_VOICE_ID;
    const voiceIdB = process.env.ELEVENLABS_VOICE_ID_B || 'EXAVITQu4vr4xnSDxMaL';

    if (!apiKey || !voiceIdA) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const trimmedText = text.slice(0, MAX_TTS_LENGTH);
    const segments = parsePassage(trimmedText);
    const isDialogue = segments.some(s => s.speaker !== 'mono');

    const finalBuffer = isDialogue
      ? await generateSequential(segments, voiceIdA, voiceIdB, apiKey)
      : await generateSegment(trimmedText, voiceIdA, apiKey);

    const key = `listening/${cacheId || Date.now()}.mp3`;
    const audioUrl = await uploadAudioToR2(key, finalBuffer);

    if (cacheId) {
      await prisma.listeningCache.update({ where: { id: cacheId }, data: { audioUrl } }).catch(() => {});
    }

    return NextResponse.json({ audioUrl, fromCache: false });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS route error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
