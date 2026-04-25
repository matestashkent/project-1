'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile, clearProfile } from '@/lib/storage';
import { StudentProfile } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function ProgressPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
  }, [router]);

  if (!profile) return null;

  const bands = profile.writingBands.slice(-6);
  const avgBand =
    bands.length > 0
      ? (bands.reduce((s, b) => s + b.band, 0) / bands.length).toFixed(1)
      : null;
  const maxBand = bands.length > 0 ? Math.max(...bands.map((b) => b.band)) : 0;

  const readings = profile.readingScores.slice(-6);
  const avgReading =
    readings.length > 0
      ? Math.round(readings.reduce((s, r) => s + r.percent, 0) / readings.length)
      : null;

  const noData = bands.length === 0 && readings.length === 0;

  const examLabel: Record<string, string> = {
    '1month': 'Через 1 месяц',
    '2-3months': 'Через 2–3 месяца',
    '3-6months': 'Через 3–6 месяцев',
    flexible: 'Гибкий план',
  };

  const handleReset = () => {
    if (confirm('Удалить весь прогресс и начать заново?')) {
      clearProfile();
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-5">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Прогресс</p>
        <h1 className="text-xl font-bold text-white mt-1">{profile.name}</h1>
      </div>

      {/* Goal card */}
      <div className="mx-5 mb-4 bg-gold/8 border border-gold/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">Цель</p>
          <p className="text-white font-bold text-xl mt-0.5">Band {profile.targetBand}</p>
          <p className="text-gray-500 text-xs mt-0.5">{examLabel[profile.examIn] ?? profile.examIn}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Текущий средний</p>
          <p className="text-gold font-bold text-3xl mt-0.5">{avgBand ?? '—'}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: '📚', label: 'Уроков пройдено', value: profile.lessonsCompleted },
          { icon: '✍️', label: 'Эссе написано', value: profile.writingSubmissions },
          { icon: '📝', label: 'Mock экзаменов', value: profile.mockExamsCompleted },
          { icon: '🔥', label: 'Дней подряд', value: profile.streak },
        ].map((s) => (
          <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{s.icon}</span>
              <p className="text-gray-500 text-xs leading-tight">{s.label}</p>
            </div>
            <p className="text-gold text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Writing chart */}
      {bands.length > 0 && (
        <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Writing — последние оценки</p>
            <p className="text-gold font-bold">{avgBand}</p>
          </div>
          <div className="flex items-end gap-2 h-20">
            {bands.map((b, i) => {
              const h = Math.max(4, ((b.band - 4) / 5) * 100);
              const color = b.band >= 7 ? '#22c55e' : b.band >= 6 ? '#C9A227' : '#ef4444';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {b.band.toFixed(1)}
                  </span>
                  <div
                    className="w-full rounded-t-sm"
                    style={{ height: `${h}%`, backgroundColor: color, minHeight: 4 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-gray-600 text-xs">Макс: {maxBand.toFixed(1)}</p>
            <p className="text-gray-600 text-xs">Цель: {profile.targetBand}</p>
          </div>
        </div>
      )}

      {/* Reading */}
      {avgReading !== null && (
        <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">Reading — средний результат</p>
            <p className="text-gold font-bold">{avgReading}%</p>
          </div>
          <div className="h-2 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${avgReading}%`,
                backgroundColor: avgReading >= 70 ? '#22c55e' : avgReading >= 50 ? '#C9A227' : '#ef4444',
              }}
            />
          </div>
        </div>
      )}

      {/* No data */}
      {noData && (
        <div className="mx-5 text-center py-10">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-white font-semibold">Данных пока нет</p>
          <p className="text-gray-500 text-sm mt-2 mb-6">Выполни несколько заданий чтобы увидеть прогресс</p>
          <Link href="/lesson">
            <div className="inline-block py-3 px-6 bg-gold text-surface font-bold rounded-xl">
              Начать урок →
            </div>
          </Link>
        </div>
      )}

      {/* Reset */}
      <div className="mx-5 mt-4">
        <button
          onClick={handleReset}
          className="w-full py-3 bg-surface-card border border-surface-border text-gray-600 text-sm rounded-xl active:scale-[0.98] transition-transform"
        >
          Сбросить прогресс
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
