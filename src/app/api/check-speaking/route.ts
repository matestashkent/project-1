import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildSpeakingEvalPrompt, CueCard } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { profile, cue, transcript } = (await request.json()) as {
      profile: StudentProfile;
      cue: CueCard;
      transcript: string;
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildSpeakingEvalPrompt(cue, transcript, profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const feedback = JSON.parse(match[0]);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Speaking check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
