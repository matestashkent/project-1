import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildListeningPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPICS = [
  'technology', 'environment', 'education', 'health',
  'society', 'science', 'culture', 'economics', 'travel', 'work',
];

export async function POST(request: NextRequest) {
  try {
    const { profile } = (await request.json()) as { profile: StudentProfile };
    const level = profile.level || 'B1-B2';

    // Pick a random topic
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // Check cache: find a cached passage for this level+topic that has audio
    const cached = await prisma.listeningCache.findFirst({
      where: { level, topic, audioUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      return NextResponse.json({
        listening: {
          id: cached.id,
          title: cached.title,
          passage: cached.passage,
          questions: cached.questions,
        },
        audioUrl: cached.audioUrl,
        fromCache: true,
      });
    }

    // No cache — generate new content with Claude
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildListeningPrompt(profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const data = JSON.parse(match[0]);

    // Save to cache (without audioUrl yet — TTS route will update it)
    const cacheEntry = await prisma.listeningCache.create({
      data: {
        level,
        topic,
        title: data.title,
        passage: data.passage,
        questions: data.questions,
        audioUrl: null,
      },
    });

    return NextResponse.json({
      listening: {
        id: cacheEntry.id,
        title: data.title,
        passage: data.passage,
        questions: data.questions,
      },
      audioUrl: null,
      fromCache: false,
    });
  } catch (error) {
    console.error('Listening generate error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
