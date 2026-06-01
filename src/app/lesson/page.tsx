'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, incrementLessons } from '@/lib/storage';
import { StudentProfile, Lesson } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import SocraticChat from '@/components/SocraticChat';
import { useUser } from '@/lib/userContext';

export default function LessonPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [taskRevealed, setTaskRevealed] = useState(false);
  const [taskAnswer, setTaskAnswer] = useState('');
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);
  const [taskChecking, setTaskChecking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const p = getProfile();
    if (p) {
      setProfile(p);
      loadLesson(p);
      return;
    }
    if (user) {
      const fallback: StudentProfile = {
        name: user.name,
        language: user.language as StudentProfile['language'],
        level: user.level as StudentProfile['level'],
        targetBand: user.targetBand,
        examIn: user.examIn,
        studyMinutes: user.studyMinutes,
        weakAreas: user.weakAreas as StudentProfile['weakAreas'],
        createdAt: '',
        lastActive: '',
        streak: user.streak,
        lessonsCompleted: user.lessonsCompleted,
        writingSubmissions: user.writingSubmissions,
        mockExamsCompleted: user.mockExamsCompleted,
        writingBands: user.writingBands.map(b => ({ date: typeof b.date === 'string' ? b.date : new Date(b.date).toISOString(), band: b.band })),
        readingScores: [],
      };
      setProfile(fallback);
      loadLesson(fallback);
      return;
    }
    router.replace('/');
  }, [authLoading, user, router]);

  const checkTaskAnswer = async () => {
    if (!profile || !lesson || !taskAnswer.trim() || taskChecking) return;
    setTaskChecking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          profile,
          lessonContent: lessonText,
          chatHistory: [],
          message: `Задание было: "${lesson.task}"\n\nМой ответ: "${taskAnswer.trim()}"\n\nОцени мой ответ: что сделано правильно, что улучшить, дай конкретный совет.`,
        }),
      });
      const data = await res.json();
      setTaskFeedback(data.reply);
    } catch {
      setTaskFeedback('Не удалось проверить ответ. Попробуй ещё раз.');
    } finally {
      setTaskChecking(false);
    }
  };

  const loadLesson = async (p: StudentProfile) => {
    setLoading(true);
    setError(false);
    setTaskRevealed(false);
    setTaskAnswer('');
    setTaskFeedback(null);
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ profile: p }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLesson(data.lesson);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    incrementLessons();
    setTaskRevealed(true);
    if (token) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ incrementLessons: true }),
      }).catch(() => {});
    }
  };

  const lessonText = lesson
    ? `Topic: ${lesson.topic}\n\n${lesson.explanation}\n\nGood example: ${lesson.goodExample}\n\nTask: ${lesson.task}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 bg-gold/10 border border-gold/30 rounded-3xl flex items-center justify-center animate-pulse">
          <span className="text-4xl">📚</span>
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Генерирую урок для тебя...</p>
          <p className="text-gray-500 text-sm mt-1">Адаптирую под твой уровень</p>
        </div>
        <div className="flex gap-2">
          {[0, 150, 300].map((d) => (
            <div key={d} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-5xl">😔</span>
        <p className="text-white font-semibold">Не удалось загрузить урок</p>
        <button
          onClick={() => profile && loadLesson(profile)}
          className="px-6 py-3 bg-gold text-surface font-bold rounded-xl"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-36">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Урок дня</p>
        <h1 className="text-xl font-bold text-white mt-1">{lesson.topic}</h1>
      </div>

      {/* Why important */}
      <div className="mx-5 mb-4 bg-gold/8 border border-gold/20 rounded-xl p-4">
        <p className="text-gold text-xs font-bold mb-1.5 uppercase tracking-wide">Зачем это важно</p>
        <p className="text-white text-sm leading-relaxed">{lesson.whyImportant}</p>
      </div>

      {/* Explanation */}
      <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
        <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wide">Объяснение</p>
        <p className="text-white text-sm leading-relaxed">{lesson.explanation}</p>
      </div>

      {/* Examples */}
      <div className="mx-5 space-y-3 mb-5">
        <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-4">
          <p className="text-emerald-400 text-xs font-bold mb-2 uppercase tracking-wide">✓ Хороший пример</p>
          <p className="text-white text-sm italic leading-relaxed">{lesson.goodExample}</p>
        </div>
        <div className="bg-rose-500/8 border border-rose-500/25 rounded-xl p-4">
          <p className="text-rose-400 text-xs font-bold mb-2 uppercase tracking-wide">✗ Как не надо</p>
          <p className="text-white text-sm italic leading-relaxed">{lesson.badExample}</p>
        </div>
      </div>

      {/* Task reveal */}
      {!taskRevealed ? (
        <div className="mx-5 space-y-3">
          <button
            onClick={handleComplete}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Понял! Дай задание →
          </button>
          <button
            onClick={() => profile && loadLesson(profile)}
            className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            Другая тема
          </button>
        </div>
      ) : (
        <div className="mx-5 space-y-3">
          {/* Task description */}
          <div className="bg-violet-500/8 border border-violet-500/25 rounded-xl p-4">
            <p className="text-violet-400 text-xs font-bold mb-2 uppercase tracking-wide">📝 Задание</p>
            <p className="text-white text-sm leading-relaxed">{lesson.task}</p>
          </div>

          {/* Answer input */}
          {!taskFeedback ? (
            <>
              <textarea
                value={taskAnswer}
                onChange={(e) => setTaskAnswer(e.target.value)}
                placeholder="Напиши свой ответ здесь..."
                className="w-full h-36 bg-surface-card border border-surface-border rounded-xl p-4 text-white text-sm leading-relaxed outline-none focus:border-violet-400 transition-colors resize-none"
              />
              <button
                onClick={checkTaskAnswer}
                disabled={!taskAnswer.trim() || taskChecking}
                className="w-full py-4 bg-violet-500 text-white font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {taskChecking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Проверяю...
                  </>
                ) : (
                  'Проверить ответ →'
                )}
              </button>
            </>
          ) : (
            <>
              {/* Feedback */}
              <div className="bg-surface-card border border-violet-500/30 rounded-xl p-4">
                <p className="text-violet-400 text-xs font-bold mb-2 uppercase tracking-wide">Фидбек Mentora</p>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{taskFeedback}</p>
              </div>
              <button
                onClick={() => profile && loadLesson(profile)}
                className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
              >
                Следующий урок →
              </button>
            </>
          )}
        </div>
      )}

      {/* Ask Ustoz floating button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-5 z-30">
        <button
          onClick={() => setChatOpen(true)}
          className="bg-surface-card border border-gold/60 text-gold font-semibold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🎓</span>
          <span>Спроси Mentora</span>
        </button>
      </div>

      {profile && (
        <SocraticChat
          profile={profile}
          lessonContent={lessonText}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
