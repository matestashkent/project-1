'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, addWritingBand } from '@/lib/storage';
import { StudentProfile, WritingFeedback } from '@/lib/types';
import { TASK1_TASKS, Task1Data } from '@/lib/prompts';
import { useUser } from '@/lib/userContext';
import BottomNav from '@/components/BottomNav';
import WritingFeedbackDisplay from '@/components/WritingFeedback';

const TYPE_ICON: Record<string, string> = {
  'Bar Chart': '📊',
  'Line Graph': '📈',
  'Pie Chart': '🥧',
  'Table': '📋',
};

export default function Task1Page() {
  const router = useRouter();
  const { user, telegramId } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [task, setTask] = useState<Task1Data | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p && !user) { router.replace('/'); return; }
    setProfile(p);
    pickTask();
  }, [router, user]);

  const pickTask = () => {
    setTask(TASK1_TASKS[Math.floor(Math.random() * TASK1_TASKS.length)]);
  };

  const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0;
  const minWords = 150;
  const ready = wordCount >= minWords;

  const handleSubmit = async () => {
    if (!task || !ready || loading) return;
    const activeProfile = profile || {
      name: user?.name || 'Student',
      language: 'ru' as const,
      level: (user?.level || 'B1-B2') as StudentProfile['level'],
      targetBand: user?.targetBand || 6.5,
      examIn: user?.examIn || 'flexible',
      studyMinutes: user?.studyMinutes || 30,
      weakAreas: (user?.weakAreas || ['writing']) as StudentProfile['weakAreas'],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      streak: user?.streak || 0,
      lessonsCompleted: user?.lessonsCompleted || 0,
      writingSubmissions: user?.writingSubmissions || 0,
      mockExamsCompleted: user?.mockExamsCompleted || 0,
      writingBands: [],
      readingScores: [],
    };

    setLoading(true);
    try {
      const res = await fetch('/api/check-writing-task1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(telegramId ? { 'x-telegram-id': telegramId } : {}),
        },
        body: JSON.stringify({ profile: activeProfile, task, response }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
      addWritingBand(data.feedback.overallBand);
    } catch {
      alert('Ошибка при проверке. Попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setResponse('');
    pickTask();
  };

  if (!task) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Writing</p>
        <h1 className="text-xl font-bold text-white mt-1">Task 1 — Описание данных</h1>
      </div>

      {/* Task type badge + title */}
      <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{TYPE_ICON[task.type] || '📊'}</span>
          <span className="text-gold text-xs font-bold uppercase tracking-wide">{task.type}</span>
        </div>
        <p className="text-white text-sm font-medium leading-snug mb-3">{task.description}</p>

        {/* Data table */}
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <pre className="text-gray-300 text-xs leading-relaxed font-mono whitespace-pre">
            {task.data}
          </pre>
        </div>

        <p className="text-gray-500 text-xs mt-3 leading-relaxed">
          Summarise the information by selecting and reporting the main features, and make comparisons where relevant.
        </p>
        <p className="text-gray-600 text-xs mt-1">Minimum 150 words · Task 1 · 20 minutes</p>
      </div>

      {/* Key tips */}
      <div className="mx-5 mb-4 bg-gold/8 border border-gold/20 rounded-xl p-3">
        <p className="text-gold text-xs font-bold mb-1.5">Структура Task 1:</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          1. Обзор (overview) — 2 главные тенденции{'\n'}
          2. Детали — конкретные цифры и сравнения{'\n'}
          3. Без личного мнения и выводов о причинах
        </p>
      </div>

      {!feedback ? (
        <>
          <div className="mx-5 mb-3">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="The chart illustrates..."
              className="w-full h-56 bg-surface-card border border-surface-border rounded-xl p-4 text-white text-sm leading-relaxed outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          <div className="mx-5 mb-5 flex items-center justify-between">
            <span className={`text-sm font-medium ${ready ? 'text-emerald-400' : 'text-gray-500'}`}>
              {wordCount} слов{!ready && ` — ещё ${minWords - wordCount}`}
            </span>
            {ready && <span className="text-emerald-400 text-sm">✓ Готово</span>}
          </div>

          <div className="mx-5">
            <button
              onClick={handleSubmit}
              disabled={!ready || loading}
              className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                  Проверяю...
                </>
              ) : (
                'Отправить на проверку →'
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mx-5 mb-5">
            <WritingFeedbackDisplay feedback={feedback} />
          </div>
          <div className="mx-5">
            <button
              onClick={reset}
              className="w-full py-4 bg-surface-card border border-gold text-gold font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
            >
              Новое задание
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
