import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildLessonPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildLessonPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const lesson = extractJSON(content.text);
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Lesson error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
