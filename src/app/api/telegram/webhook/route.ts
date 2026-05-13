import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMessage, answerCallbackQuery, inlineKeyboard, miniAppButton } from '@/lib/telegram';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.railway.app';

// In-memory onboarding sessions (works fine on Railway, one server)
const sessions = new Map<number, {
  step: string;
  data: Record<string, string | number | string[]>;
}>();

type TelegramUser = { id: number; first_name: string; language_code?: string };
type Message = { chat: { id: number }; from?: TelegramUser; text?: string };
type CallbackQuery = { id: string; from: TelegramUser; data?: string; message?: Message };
type Update = { message?: Message; callback_query?: CallbackQuery };

async function getOrCreateUser(tgUser: TelegramUser) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(tgUser.id) },
    update: { lastActive: new Date() },
    create: {
      telegramId: BigInt(tgUser.id),
      name: tgUser.first_name,
      language: tgUser.language_code?.startsWith('uz') ? 'uz' : 'ru',
    },
  });
}

async function handleStart(chatId: number, tgUser: TelegramUser) {
  const existing = await prisma.user.findUnique({ where: { telegramId: BigInt(tgUser.id) } });

  if (existing && existing.weakAreas.length > 0) {
    // Already registered — show app button
    await sendMessage(chatId, `С возвращением, ${existing.name}! 👋\n\nТвой прогресс сохранён. Открывай приложение:`,
      miniAppButton('📚 Открыть Mentora', APP_URL));
    return;
  }

  // Start onboarding
  sessions.set(chatId, { step: 'level', data: { name: tgUser.first_name } });
  await getOrCreateUser(tgUser);

  await sendMessage(chatId,
    `Привет, ${tgUser.first_name}! 👋\n\nЯ <b>Mentora</b> — твой AI-репетитор по IELTS.\n\nЗадам 4 быстрых вопроса, чтобы составить персональный план.\n\n<b>Вопрос 1/4:</b> Какой у тебя уровень английского?`,
    inlineKeyboard([
      [{ text: '🌱 Начинающий (A1-A2)', data: 'level:A1-A2' }],
      [{ text: '📈 Средний (B1-B2)', data: 'level:B1-B2' }],
      [{ text: '🚀 Продвинутый (C1-C2)', data: 'level:C1-C2' }],
    ])
  );
}

async function handleCallback(chatId: number, tgUser: TelegramUser, data: string, callbackId: string) {
  await answerCallbackQuery(callbackId);
  const session = sessions.get(chatId);
  if (!session) return;

  const [key, value] = data.split(':');

  if (key === 'level') {
    session.data.level = value;
    session.step = 'band';
    sessions.set(chatId, session);
    await sendMessage(chatId,
      '<b>Вопрос 2/4:</b> Какой балл IELTS тебе нужен?',
      inlineKeyboard([
        [{ text: '5.5 — виза / работа', data: 'band:5.5' }],
        [{ text: '6.0 — университет', data: 'band:6.0' }],
        [{ text: '6.5 — хорошие программы', data: 'band:6.5' }],
        [{ text: '7.0+ — топ-университеты', data: 'band:7.0' }],
      ])
    );
  } else if (key === 'band') {
    session.data.targetBand = parseFloat(value);
    session.step = 'examIn';
    sessions.set(chatId, session);
    await sendMessage(chatId,
      '<b>Вопрос 3/4:</b> Когда планируешь сдавать?',
      inlineKeyboard([
        [{ text: '⚡ Через 1 месяц', data: 'examIn:1month' }],
        [{ text: '📅 Через 2–3 месяца', data: 'examIn:2-3months' }],
        [{ text: '🗓 Через 3–6 месяцев', data: 'examIn:3-6months' }],
        [{ text: '🤷 Пока не знаю', data: 'examIn:flexible' }],
      ])
    );
  } else if (key === 'examIn') {
    session.data.examIn = value;
    session.step = 'weakAreas';
    sessions.set(chatId, session);
    await sendMessage(chatId,
      '<b>Вопрос 4/4:</b> Что хочешь улучшить? (выбери главное)',
      inlineKeyboard([
        [{ text: '✍️ Writing', data: 'weak:writing' }],
        [{ text: '📖 Reading', data: 'weak:reading' }],
        [{ text: '🎧 Listening', data: 'weak:listening' }],
        [{ text: '🗣 Speaking', data: 'weak:speaking' }],
        [{ text: '📚 Всё сразу', data: 'weak:all' }],
      ])
    );
  } else if (key === 'weak') {
    const weakAreas = value === 'all'
      ? ['writing', 'reading', 'listening', 'speaking']
      : [value];

    // Save completed profile to DB
    await prisma.user.update({
      where: { telegramId: BigInt(tgUser.id) },
      data: {
        level: String(session.data.level || 'B1-B2'),
        targetBand: Number(session.data.targetBand || 6.5),
        examIn: String(session.data.examIn || 'flexible'),
        weakAreas,
      },
    });

    sessions.delete(chatId);

    await sendMessage(chatId,
      `Отлично! Твой план готов 🎉\n\n<b>Уровень:</b> ${session.data.level}\n<b>Цель:</b> IELTS Band ${session.data.targetBand}\n<b>Фокус:</b> ${weakAreas.join(', ')}\n\nОткрывай Mentora и начинай первый урок:`,
      miniAppButton('🚀 Начать обучение', APP_URL)
    );
  }
}

async function handleCommand(chatId: number, tgUser: TelegramUser, text: string) {
  if (text.startsWith('/start')) {
    await handleStart(chatId, tgUser);
  } else if (text.startsWith('/app')) {
    await sendMessage(chatId, 'Открывай приложение:', miniAppButton('📚 Mentora', APP_URL));
  } else if (text.startsWith('/progress')) {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(tgUser.id) },
      include: { essays: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!user) { await handleStart(chatId, tgUser); return; }
    const lastBand = user.essays[0]?.overallBand?.toFixed(1) ?? '—';
    await sendMessage(chatId,
      `📊 <b>Твой прогресс</b>\n\nУроков: ${user.lessonsCompleted}\nЭссе: ${user.writingSubmissions}\nПоследний балл: ${lastBand}\nСерия: ${user.streak} дней\n\nЦель: Band ${user.targetBand}`,
      miniAppButton('Подробнее в приложении', APP_URL)
    );
  } else if (text.startsWith('/subscribe')) {
    await sendMessage(chatId,
      '💳 <b>Тарифы Mentora</b>\n\n🟢 <b>Старт</b> — $19/мес\nWriting + Reading + Vocabulary\n\n🔵 <b>Основной</b> — $39/мес\nВсе 4 навыка + Mock Exam + Отчёты\n\n🟣 <b>Интенсив</b> — $59/мес\nБезлимит + приоритетная обработка\n\nОплата через приложение:',
      miniAppButton('Оформить подписку', `${APP_URL}/subscribe`)
    );
  } else if (text.startsWith('/help')) {
    await sendMessage(chatId,
      '📋 <b>Команды Mentora</b>\n\n/start — начать / вернуться\n/app — открыть приложение\n/progress — мой прогресс\n/subscribe — тарифы и оплата\n/help — эта справка\n\nПо всем вопросам: @mentora_support'
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const update: Update = await req.json();

    if (update.message) {
      const { chat, from, text } = update.message;
      if (!from || !text) return NextResponse.json({ ok: true });
      await handleCommand(chat.id, from, text);
    }

    if (update.callback_query) {
      const { id, from, data, message } = update.callback_query;
      if (!data || !message) return NextResponse.json({ ok: true });
      await handleCallback(message.chat.id, from, data, id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
