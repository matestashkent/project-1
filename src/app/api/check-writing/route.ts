import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildWritingCheckPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { profile, prompt, essay } = (await request.json()) as {
      profile: StudentProfile;
      prompt: string;
      essay: string;
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildWritingCheckPrompt(prompt, essay, profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const feedback = JSON.parse(match[0]);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Writing check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
