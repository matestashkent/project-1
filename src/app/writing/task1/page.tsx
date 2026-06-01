'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, addWritingBand } from '@/lib/storage';
import { StudentProfile, WritingFeedback } from '@/lib/types';
import { TASK1_TASKS, Task1Data } from '@/lib/prompts';
import { useUser } from '@/lib/userContext';
import { profileFromDbUser } from '@/lib/profileUtils';
import BottomNav from '@/components/BottomNav';
import WritingFeedbackDisplay from '@/components/WritingFeedback';

const TYPE_ICON: Record<string, string> = {
  'Bar Chart': '📊',
  'Line Graph': '📈',
  'Pie Chart': '🥧',
  'Table': '📋',
};

const TYPE_TIPS: Record<string, { steps: string[]; vocab: string[]; avoid: string }> = {
  'Bar Chart': {
    steps: [
      'Найди наибольшее и наименьшее значение по каждой категории',
      'Сравни страны/группы между собой — кто лидирует, кто отстаёт',
      'Напиши overview (2 предложения) — главные тенденции без цифр',
      'В деталях — конкретные цифры + сравнения (в 2 раза больше / similar to)',
    ],
    vocab: ['accounts for', 'is significantly higher than', 'in contrast to', 'the largest share', 'while', 'whereas', 'followed by'],
    avoid: 'Не объясняй причины ("because of...") и не давай своё мнение',
  },
  'Line Graph': {
    steps: [
      'Определи общий тренд каждой линии: рост, падение, стабильность',
      'Найди пики (maximum) и минимумы — в каком году/месяце',
      'Отметь точки пересечения линий или резкие изменения',
      'Overview: общая тенденция за весь период',
    ],
    vocab: ['rose sharply', 'declined steadily', 'remained stable', 'peaked at', 'reached a low of', 'fluctuated', 'overtook', 'by contrast'],
    avoid: 'Не описывай каждую точку подряд — выбирай ключевые изменения',
  },
  'Pie Chart': {
    steps: [
      'Определи наибольший и наименьший сектор (в %)',
      'Сгруппируй похожие по размеру категории вместе',
      'Если два чарта — сравни, что изменилось между ними',
      'Overview: какие категории доминируют',
    ],
    vocab: ['the largest proportion', 'accounts for nearly half', 'a quarter of', 'the smallest share', 'combined', 'slightly more than', 'compared to'],
    avoid: 'Не перечисляй все сектора по порядку — это не описание, а список',
  },
  'Table': {
    steps: [
      'Найди максимальные и минимальные значения в таблице',
      'Сравни строки (категории) и столбцы (периоды/страны)',
      'Найди исключения — что выбивается из общей картины',
      'Overview: 1-2 самые заметные тенденции по всей таблице',
    ],
    vocab: ['the highest figure', 'saw the greatest increase', 'more than double', 'by contrast', 'similarly', 'while X grew, Y fell', 'notable exception'],
    avoid: 'Не переписывай все данные из таблицы — отбирай только ключевые',
  },
};

export default function Task1Page() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [task, setTask] = useState<Task1Data | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const p = getProfile();
    const resolved = p || (user ? profileFromDbUser(user) : null);
    if (!resolved) { router.replace('/'); return; }
    setProfile(resolved);
    pickTask();
  }, [authLoading, user, router]);

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

      {/* Guide for this chart type */}
      {task && TYPE_TIPS[task.type] && (() => {
        const tips = TYPE_TIPS[task.type];
        return (
          <div className="mx-5 mb-4 space-y-3">
            {/* Steps */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <p className="text-white text-xs font-bold mb-3 uppercase tracking-wide">Как анализировать {task.type}</p>
              <div className="space-y-2">
                {tips.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-gold font-bold text-xs w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vocab */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <p className="text-white text-xs font-bold mb-2.5 uppercase tracking-wide">Полезные фразы</p>
              <div className="flex flex-wrap gap-1.5">
                {tips.vocab.map((phrase) => (
                  <span key={phrase} className="bg-gold/10 border border-gold/25 text-gold text-xs px-2.5 py-1 rounded-lg">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>

            {/* Avoid */}
            <div className="bg-rose-500/8 border border-rose-500/25 rounded-xl p-3">
              <p className="text-rose-400 text-xs font-bold mb-1">Частая ошибка:</p>
              <p className="text-gray-300 text-xs leading-relaxed">{tips.avoid}</p>
            </div>

            {/* Structure reminder */}
            <div className="bg-gold/8 border border-gold/20 rounded-xl p-3">
              <p className="text-gold text-xs font-bold mb-1.5">Структура ответа:</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {'Введение (1 пр.) → Обзор/Overview (2 пр.) → Детали (2–3 пр.) → Сравнения (1–2 пр.)'}
              </p>
            </div>
          </div>
        );
      })()}

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
