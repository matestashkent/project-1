import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildChatPrompt } from '@/lib/prompts';
import { StudentProfile } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { profile, lessonContent, chatHistory, message: studentMessage } = (await request.json()) as {
      profile: StudentProfile;
      lessonContent: string;
      chatHistory: Array<{ role: string; content: string }>;
      message: string;
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: buildChatPrompt(lessonContent, chatHistory, studentMessage, profile) }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    return NextResponse.json({ reply: content.text });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
