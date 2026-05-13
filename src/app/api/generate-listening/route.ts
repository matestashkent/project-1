import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildListeningPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

const TOPICS = [
  'technology', 'environment', 'education', 'health',
  'society', 'science', 'culture', 'economics', 'travel', 'work',
];

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`listening:${telegramId}`, 10)) {
    return NextResponse.json({ error: 'Лимит заданий на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };
    const level = profile.level || 'B1-B2';
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const cached = await prisma.listeningCache.findFirst({
      where: { level, topic, audioUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      return NextResponse.json({
        listening: { id: cached.id, title: cached.title, passage: cached.passage, questions: cached.questions },
        audioUrl: cached.audioUrl,
        fromCache: true,
      });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        { type: 'text', text: buildSystemPrompt(profile), cache_control: { type: 'ephemeral' } },
      ] as Parameters<typeof client.messages.create>[0]['system'],
      messages: [{ role: 'user', content: buildListeningPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const data = JSON.parse(match[0]);

    const cacheEntry = await prisma.listeningCache.create({
      data: { level, topic, title: data.title, passage: data.passage, questions: data.questions, audioUrl: null },
    });

    return NextResponse.json({
      listening: { id: cacheEntry.id, title: data.title, passage: data.passage, questions: data.questions },
      audioUrl: null,
      fromCache: false,
    });
  } catch (error) {
    console.error('Listening generate error:', error);
    return NextResponse.json({ error: 'Failed to generate listening task' }, { status: 500 });
  }
}
