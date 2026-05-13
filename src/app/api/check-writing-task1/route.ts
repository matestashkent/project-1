import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildTask1CheckPrompt, Task1Data } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_RESPONSE_LENGTH = 6000;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`writing:${telegramId}`, 5)) {
    return NextResponse.json({ error: 'Лимит проверок на этот час исчерпан.' }, { status: 429 });
  }

  try {
    const { profile, task, response: studentResponse } = (await request.json()) as {
      profile: StudentProfile;
      task: Task1Data;
      response: string;
    };

    if (!studentResponse || studentResponse.trim().length < 30) {
      return NextResponse.json({ error: 'Response is too short' }, { status: 400 });
    }

    const trimmedResponse = studentResponse.slice(0, MAX_RESPONSE_LENGTH);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildTask1CheckPrompt(task, trimmedResponse, profile) }],
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
          taskType: 'task1',
          prompt: task.description,
          text: trimmedResponse,
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
    console.error('Task1 check error:', error);
    return NextResponse.json({ error: 'Failed to check response' }, { status: 500 });
  }
}
