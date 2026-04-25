'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage, StudentProfile } from '@/lib/types';

interface Props {
  profile: StudentProfile;
  lessonContent: string;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_BUTTONS = ['Не понял', 'Объясни попроще', 'Дай пример', 'Углуби тему'];

export default function SocraticChat({ profile, lessonContent, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          lessonContent,
          chatHistory: messages,
          message: text,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Произошла ошибка. Попробуй ещё раз.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-card">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-gold text-xl"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="font-semibold text-white leading-none">Устоз</p>
          <p className="text-xs text-gray-500 mt-0.5">AI-наставник</p>
        </div>
        {loading && (
          <div className="flex gap-1">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-2 h-2 bg-gold rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-5xl mb-4">🎓</p>
            <p className="font-medium text-white">Спроси что угодно по уроку</p>
            <p className="text-sm mt-1">Я объясню по-другому, если непонятно</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold text-surface rounded-br-sm font-medium'
                  : 'bg-surface-card text-white border border-surface-border rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick buttons */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_BUTTONS.map((btn) => (
          <button
            key={btn}
            onClick={() => sendMessage(btn)}
            disabled={loading}
            className="flex-shrink-0 text-xs border border-gold/60 text-gold rounded-full px-3 py-1.5 active:bg-gold active:text-surface transition-colors disabled:opacity-40"
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex gap-3 bg-surface-card border-t border-surface-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Напиши вопрос..."
          className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center text-surface font-bold text-lg disabled:opacity-40 active:scale-95 transition-all"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
