import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildLessonPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

const CACHE_POOL_MIN = 5;

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`lesson:${telegramId}`, 10)) {
    return NextResponse.json({ error: 'Лимит уроков на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };
    const level = profile.level || 'B1-B2';

    const cached = await prisma.lessonCache.findMany({ where: { level } });
    if (cached.length >= CACHE_POOL_MIN) {
      const item = cached[Math.floor(Math.random() * cached.length)];
      const lesson = {
        topic: item.topic,
        whyImportant: item.whyImportant,
        explanation: item.explanation,
        goodExample: item.goodExample,
        badExample: item.badExample,
        task: item.task,
      };
      return NextResponse.json({ lesson });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        { type: 'text', text: buildSystemPrompt(profile), cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: buildLessonPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const lesson = extractJSON(content.text);

    await prisma.lessonCache.create({
      data: {
        level,
        topic: lesson.topic,
        whyImportant: lesson.whyImportant,
        explanation: lesson.explanation,
        goodExample: lesson.goodExample,
        badExample: lesson.badExample,
        task: lesson.task,
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Lesson error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
