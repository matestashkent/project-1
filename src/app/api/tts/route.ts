import { NextRequest, NextResponse } from 'next/server';
import { uploadAudioToR2 } from '@/lib/r2';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text, cacheId } = (await request.json()) as { text: string; cacheId?: string };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // If cacheId given and audio already exists — return cached URL
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
      return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 });
    }

    // Generate audio with ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', err);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    // Upload to R2
    const key = `listening/${cacheId || Date.now()}.mp3`;
    const audioUrl = await uploadAudioToR2(key, audioBuffer);

    // Update DB cache entry with audio URL
    if (cacheId) {
      await prisma.listeningCache.update({
        where: { id: cacheId },
        data: { audioUrl },
      });
    }

    return NextResponse.json({ audioUrl, fromCache: false });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
