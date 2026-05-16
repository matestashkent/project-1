import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioToR2 } from '@/lib/r2';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_TTS_LENGTH = 5000;

type Segment = { speaker: 'A' | 'B' | 'mono'; text: string };

function parsePassage(text: string): Segment[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const segments: Segment[] = [];

  for (const line of lines) {
    const matchA = line.match(/^Speaker\s*A\s*:\s*(.+)/i);
    const matchB = line.match(/^Speaker\s*B\s*:\s*(.+)/i);
    if (matchA) {
      segments.push({ speaker: 'A', text: matchA[1].trim() });
    } else if (matchB) {
      segments.push({ speaker: 'B', text: matchB[1].trim() });
    } else {
      segments.push({ speaker: 'mono', text: line });
    }
  }

  const isDialogue = segments.some(s => s.speaker === 'A' || s.speaker === 'B');
  if (!isDialogue) {
    return [{ speaker: 'mono', text: text.slice(0, MAX_TTS_LENGTH) }];
  }
  return segments;
}

async function generateSegment(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  return res.arrayBuffer();
}

function concatBuffers(buffers: ArrayBuffer[]): Buffer {
  return Buffer.concat(buffers.map(b => Buffer.from(b)));
}

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
    const voiceIdA = process.env.ELEVENLABS_VOICE_ID;
    // Second voice for Speaker B — defaults to Rachel (ElevenLabs stock female voice)
    const voiceIdB = process.env.ELEVENLABS_VOICE_ID_B || 'EXAVITQu4vr4xnSDxMaL';

    if (!apiKey || !voiceIdA) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const trimmedText = text.slice(0, MAX_TTS_LENGTH);
    const segments = parsePassage(trimmedText);
    const isDialogue = segments.some(s => s.speaker !== 'mono');

    let finalBuffer: Buffer;

    if (isDialogue) {
      // Generate all segments in parallel, each with its own voice
      const audioChunks = await Promise.all(
        segments.map(seg =>
          generateSegment(seg.text, seg.speaker === 'B' ? voiceIdB : voiceIdA, apiKey)
        )
      );
      finalBuffer = concatBuffers(audioChunks);
    } else {
      const buf = await generateSegment(trimmedText, voiceIdA, apiKey);
      finalBuffer = Buffer.from(buf);
    }

    const key = `listening/${cacheId || Date.now()}.mp3`;
    const audioUrl = await uploadAudioToR2(key, finalBuffer.buffer as ArrayBuffer);

    if (cacheId) {
      await prisma.listeningCache.update({ where: { id: cacheId }, data: { audioUrl } });
    }

    return NextResponse.json({ audioUrl, fromCache: false });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
