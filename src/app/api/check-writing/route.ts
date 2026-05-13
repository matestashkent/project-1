import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildWritingCheckPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

const MAX_ESSAY_LENGTH = 6000;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`writing:${telegramId}`, 5)) {
    return NextResponse.json({ error: 'Лимит проверок на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile, prompt, essay } = (await request.json()) as {
      profile: StudentProfile;
      prompt: string;
      essay: string;
    };

    if (!essay || essay.trim().length < 50) {
      return NextResponse.json({ error: 'Essay is too short' }, { status: 400 });
    }

    const trimmedEssay = essay.slice(0, MAX_ESSAY_LENGTH);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        { type: 'text', text: buildSystemPrompt(profile), cache_control: { type: 'ephemeral' } },
      ] as Parameters<typeof client.messages.create>[0]['system'],
      messages: [{ role: 'user', content: buildWritingCheckPrompt(prompt, trimmedEssay, profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const feedback = JSON.parse(match[0]);

    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    if (user) {
      await prisma.essay.create({
        data: {
          userId: user.id,
          prompt,
          text: trimmedEssay,
          taScore: feedback.taskAchievement.band,
          ccScore: feedback.coherenceCohesion.band,
          lrScore: feedback.lexicalResource.band,
          graScore: feedback.grammaticalRange.band,
          overallBand: feedback.overallBand,
          feedback: JSON.stringify(feedback),
          topTip: feedback.topTip,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { writingSubmissions: { increment: 1 }, currentBand: feedback.overallBand },
      });
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Writing check error:', error);
    return NextResponse.json({ error: 'Failed to check essay' }, { status: 500 });
  }
}
