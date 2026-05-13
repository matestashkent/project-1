import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildTask1CheckPrompt, Task1Data } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { profile, task, response: studentResponse } = (await request.json()) as {
      profile: StudentProfile;
      task: Task1Data;
      response: string;
    };

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildTask1CheckPrompt(task, studentResponse, profile) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const feedback = JSON.parse(match[0]);

    // Save to database if authenticated
    const telegramId = request.headers.get('x-telegram-id');
    if (telegramId) {
      const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
      if (user) {
        await prisma.essay.create({
          data: {
            userId: user.id,
            taskType: 'task1',
            prompt: task.description,
            text: studentResponse,
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
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Task1 check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
