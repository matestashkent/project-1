const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, extra?: object) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

export function inlineKeyboard(buttons: { text: string; data: string }[][]) {
  return {
    reply_markup: {
      inline_keyboard: buttons.map(row =>
        row.map(btn => ({ text: btn.text, callback_data: btn.data }))
      ),
    },
  };
}

export function miniAppButton(text: string, appUrl: string) {
  return {
    reply_markup: {
      inline_keyboard: [[{ text, web_app: { url: appUrl } }]],
    },
  };
}
