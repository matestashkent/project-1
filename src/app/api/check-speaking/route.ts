import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildSpeakingEvalPrompt, CueCard } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`speaking:${telegramId}`, 10)) {
    return NextResponse.json({ error: 'Лимит оценок на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile, cue, transcript } = (await request.json()) as {
      profile: StudentProfile;
      cue: CueCard;
      transcript: string;
    };

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Transcript is too short' }, { status: 400 });
    }

    const trimmedTranscript = transcript.slice(0, 4000);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildSpeakingEvalPrompt(cue, trimmedTranscript, profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const feedback = JSON.parse(match[0]);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Speaking check error:', error);
    return NextResponse.json({ error: 'Failed to evaluate speech' }, { status: 500 });
  }
}
