'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile, clearProfile } from '@/lib/storage';
import { useUser, DbUser } from '@/lib/userContext';
import BottomNav from '@/components/BottomNav';

interface FullProfile extends DbUser {
  task1Count: number;
  task2Count: number;
  recentEssays: Array<{ id: string; taskType: string; band: number; date: string }>;
}

const EXAM_LABEL: Record<string, string> = {
  '1month': 'Через 1 месяц',
  '2-3months': 'Через 2–3 месяца',
  '3-6months': 'Через 3–6 месяцев',
  flexible: 'Гибкий план',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ProgressPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useUser();
  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function loadProfile() {
      // Fetch full profile from DB if authenticated
      if (token) {
        try {
          const res = await fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const { user: data } = await res.json();
            setFullProfile(data as FullProfile);
            setLoading(false);
            return;
          }
        } catch {}
      }
      // Fallback: localStorage
      const p = getProfile();
      if (!p) { router.replace('/'); return; }
      setFullProfile({
        id: '',
        telegramId: '',
        name: p.name,
        language: p.language,
        level: p.level,
        targetBand: p.targetBand,
        examIn: p.examIn,
        studyMinutes: p.studyMinutes,
        weakAreas: p.weakAreas,
        streak: p.streak,
        lessonsCompleted: p.lessonsCompleted,
        writingSubmissions: p.writingSubmissions,
        mockExamsCompleted: p.mockExamsCompleted,
        currentBand: 0,
        writingBands: p.writingBands.map(b => ({ band: b.band, date: b.date })),
        subscription: null,
        task1Count: 0,
        task2Count: p.writingSubmissions,
        recentEssays: [],
      });
      setLoading(false);
    }

    loadProfile();
  }, [authLoading, token, router]);

  const handleReset = () => {
    if (confirm('Сбросить локальный кэш? Данные в базе останутся.')) {
      clearProfile();
      router.replace('/');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!fullProfile) return null;

  const bands = fullProfile.writingBands.slice(-8);
  const avgBand = bands.length > 0
    ? (bands.reduce((s, b) => s + b.band, 0) / bands.length).toFixed(1)
    : null;
  const maxBand = bands.length > 0 ? Math.max(...bands.map(b => b.band)) : 0;
  const progressToGoal = avgBand ? Math.min(100, Math.round(((parseFloat(avgBand) - 4) / (fullProfile.targetBand - 4)) * 100)) : 0;

  const noData = bands.length === 0 && fullProfile.lessonsCompleted === 0;

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Прогресс</p>
        <h1 className="text-xl font-bold text-white mt-1">{fullProfile.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{fullProfile.level} · Цель: Band {fullProfile.targetBand}</p>
      </div>

      {/* Goal progress */}
      <div className="mx-5 mb-4 bg-gold/8 border border-gold/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-gray-500 text-xs">Текущий средний балл</p>
            <p className="text-gold font-bold text-4xl mt-0.5">{avgBand ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Цель</p>
            <p className="text-white font-bold text-4xl mt-0.5">{fullProfile.targetBand}</p>
          </div>
        </div>
        {avgBand && (
          <>
            <div className="h-2 bg-surface-border rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${progressToGoal}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs">{progressToGoal}% от цели · {EXAM_LABEL[fullProfile.examIn] ?? fullProfile.examIn}</p>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: '📚', label: 'Уроков пройдено', value: fullProfile.lessonsCompleted },
          { icon: '🔥', label: 'Дней подряд', value: fullProfile.streak },
          { icon: '✍️', label: 'Task 2 (эссе)', value: fullProfile.task2Count },
          { icon: '📊', label: 'Task 1 (графики)', value: fullProfile.task1Count },
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

      {/* Writing band chart */}
      {bands.length > 0 && (
        <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Writing — история баллов</p>
            <p className="text-gold font-bold text-sm">макс {maxBand.toFixed(1)}</p>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-24 mb-2">
            {bands.map((b, i) => {
              const h = Math.max(8, ((b.band - 4) / 5) * 100);
              const color = b.band >= 7 ? '#22c55e' : b.band >= 6 ? '#C9A227' : '#ef4444';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color }}>{b.band.toFixed(1)}</span>
                  <div className="w-full rounded-t-sm" style={{ height: `${h}%`, backgroundColor: color }} />
                  <span className="text-[8px] text-gray-600">{formatDate(typeof b.date === 'string' ? b.date : new Date(b.date).toISOString())}</span>
                </div>
              );
            })}
          </div>
          {/* Target line indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1 border-t border-dashed border-gold/40" />
            <span className="text-gold text-xs">цель {fullProfile.targetBand}</span>
          </div>
        </div>
      )}

      {/* Recent essays */}
      {fullProfile.recentEssays.length > 0 && (
        <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Последние работы</p>
          <div className="space-y-2">
            {fullProfile.recentEssays.map((e) => {
              const color = e.band >= 7 ? '#22c55e' : e.band >= 6 ? '#C9A227' : '#ef4444';
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{e.taskType === 'task1' ? '📊' : '✍️'}</span>
                    <div>
                      <p className="text-white text-sm">Writing {e.taskType === 'task1' ? 'Task 1' : 'Task 2'}</p>
                      <p className="text-gray-500 text-xs">{formatDate(typeof e.date === 'string' ? e.date : new Date(e.date).toISOString())}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>
                    {e.band.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak areas */}
      {fullProfile.weakAreas.length > 0 && (
        <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Фокус обучения</p>
          <div className="flex flex-wrap gap-2">
            {fullProfile.weakAreas.map((area) => (
              <span key={area} className="bg-gold/10 border border-gold/25 text-gold text-xs px-3 py-1.5 rounded-lg capitalize">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
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

      {/* Settings */}
      <div className="mx-5 mt-2 mb-2">
        <button
          onClick={handleReset}
          className="w-full py-3 bg-surface-card border border-surface-border text-gray-600 text-xs rounded-xl active:scale-[0.98] transition-transform"
        >
          Сбросить локальные данные
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
