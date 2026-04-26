import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildReadingPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildReadingPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const passage = JSON.parse(match[0]);
    return NextResponse.json({ passage });
  } catch (error) {
    console.error('Reading error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
