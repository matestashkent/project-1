'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/storage';
import { StudentProfile } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
  }, [router]);

  if (!profile) return null;

  const lastBand = profile.writingBands.length > 0
    ? profile.writingBands[profile.writingBands.length - 1].band.toFixed(1)
    : '—';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер';

  const modules = [
    {
      href: '/lesson',
      icon: '📚',
      title: 'Урок дня',
      sub: 'Персональный AI-урок',
      grad: 'from-violet-500/15 to-blue-500/15',
      border: 'border-violet-500/30',
    },
    {
      href: '/writing',
      icon: '✍️',
      title: 'Writing Task 2',
      sub: 'Напиши эссе и получи фидбек',
      grad: 'from-gold/15 to-amber-500/15',
      border: 'border-gold/30',
    },
    {
      href: '/reading',
      icon: '📖',
      title: 'Reading Practice',
      sub: 'True / False / Not Given',
      grad: 'from-emerald-500/15 to-teal-500/15',
      border: 'border-emerald-500/30',
    },
    {
      href: '/exam',
      icon: '📝',
      title: 'Mock Exam',
      sub: 'Симуляционный экзамен',
      grad: 'from-rose-500/15 to-orange-500/15',
      border: 'border-rose-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{profile.name} 👋</h1>
        <p className="text-gray-600 text-sm mt-1">Цель: IELTS Band {profile.targetBand}</p>
      </div>

      {/* Stats */}
      <div className="px-5 grid grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Уроков', value: profile.lessonsCompleted },
          { label: 'Эссе', value: profile.writingSubmissions },
          { label: 'Балл', value: lastBand },
          { label: 'Дней', value: profile.streak },
        ].map((s) => (
          <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-3 text-center">
            <p className="text-gold text-lg font-bold leading-none">{s.value}</p>
            <p className="text-gray-500 text-[10px] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily goal */}
      <div className="px-5 mb-6">
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-white text-sm font-semibold">Цель дня: {profile.studyMinutes} минут</p>
            <p className="text-gray-500 text-xs mt-0.5">Начни с урока — это займёт 10 минут</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="px-5 space-y-3">
        <p className="text-white font-semibold text-sm text-gray-400 uppercase tracking-wide text-xs">Модули</p>
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <div
              className={`bg-gradient-to-r ${mod.grad} border ${mod.border} rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform`}
            >
              <div className="w-12 h-12 bg-surface/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{mod.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{mod.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{mod.sub}</p>
              </div>
              <span className="text-gray-500 text-xl">›</span>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
