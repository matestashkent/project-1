'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, incrementLessons } from '@/lib/storage';
import { StudentProfile, Lesson } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import SocraticChat from '@/components/SocraticChat';

export default function LessonPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [taskRevealed, setTaskRevealed] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    loadLesson(p);
  }, [router]);

  const loadLesson = async (p: StudentProfile) => {
    setLoading(true);
    setError(false);
    setTaskRevealed(false);
    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <div className="bg-violet-500/8 border border-violet-500/25 rounded-xl p-4">
            <p className="text-violet-400 text-xs font-bold mb-2 uppercase tracking-wide">📝 Задание</p>
            <p className="text-white text-sm leading-relaxed">{lesson.task}</p>
            <p className="text-gray-500 text-xs mt-3">Выполни и спроси Устоза если непонятно ↓</p>
          </div>
        </div>
      )}

      {/* Ask Ustoz floating button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-5 z-30">
        <button
          onClick={() => setChatOpen(true)}
          className="bg-surface-card border border-gold/60 text-gold font-semibold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🎓</span>
          <span>Спроси Устоза</span>
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
