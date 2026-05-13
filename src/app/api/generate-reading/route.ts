import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildReadingPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

const CACHE_POOL_MIN = 5;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`reading:${telegramId}`, 10)) {
    return NextResponse.json({ error: 'Лимит заданий на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };
    const level = profile.level || 'B1-B2';

    const cached = await prisma.readingCache.findMany({ where: { level } });
    if (cached.length >= CACHE_POOL_MIN) {
      const item = cached[Math.floor(Math.random() * cached.length)];
      const passage = { title: item.title, text: item.text, questions: item.questions };
      return NextResponse.json({ passage });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        { type: 'text', text: buildSystemPrompt(profile), cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: buildReadingPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const passage = JSON.parse(match[0]);

    await prisma.readingCache.create({
      data: {
        level,
        title: passage.title,
        text: passage.text,
        questions: passage.questions,
      },
    });

    return NextResponse.json({ passage });
  } catch (error) {
    console.error('Reading error:', error);
    return NextResponse.json({ error: 'Failed to generate passage' }, { status: 500 });
  }
}
