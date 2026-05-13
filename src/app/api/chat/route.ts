import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildChatPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';
import { requireAuth, isAuthError } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
});

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  const { telegramId } = auth;

  if (!rateLimit(`chat:${telegramId}`, 30)) {
    return NextResponse.json({ error: 'Лимит сообщений на этот час исчерпан. Попробуй позже.' }, { status: 429 });
  }

  try {
    const { profile, lessonContent, chatHistory, message: studentMessage } = (await request.json()) as {
      profile: StudentProfile;
      lessonContent: string;
      chatHistory: Array<{ role: string; content: string }>;
      message: string;
    };

    if (!studentMessage || studentMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const trimmedMessage = studentMessage.slice(0, 1000);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        { type: 'text', text: buildSystemPrompt(profile), cache_control: { type: 'ephemeral' } },
      ] as any,
      messages: [{ role: 'user', content: buildChatPrompt(lessonContent, chatHistory, trimmedMessage, profile) }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    return NextResponse.json({ reply: content.text });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
