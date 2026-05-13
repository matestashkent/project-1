'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/storage';
import { StudentProfile } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import SocraticChat from '@/components/SocraticChat';
import { useUser } from '@/lib/userContext';

const GENERAL_CONTEXT = `This is a general IELTS tutoring session.
The student can ask anything about IELTS: writing strategies, reading tips, grammar, vocabulary, exam techniques, score improvement advice, or any other IELTS-related questions.`;

const SKILLS = [
  {
    href: '/writing',
    icon: '✍️',
    title: 'Writing Task 2',
    sub: 'Эссе + AI оценка',
    color: 'from-gold/15 to-amber-500/10 border-gold/30',
  },
  {
    href: '/writing/task1',
    icon: '📊',
    title: 'Writing Task 1',
    sub: 'Графики и диаграммы',
    color: 'from-sky-500/15 to-blue-500/10 border-sky-500/30',
  },
  {
    href: '/reading',
    icon: '📖',
    title: 'Reading',
    sub: 'True / False / NG',
    color: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30',
  },
  {
    href: '/listening',
    icon: '🎧',
    title: 'Listening',
    sub: 'Слушай и отвечай',
    color: 'from-purple-500/15 to-violet-500/10 border-purple-500/30',
  },
  {
    href: '/speaking',
    icon: '🗣️',
    title: 'Speaking',
    sub: 'Монолог + фидбек',
    color: 'from-rose-500/15 to-pink-500/10 border-rose-500/30',
  },
  {
    href: '/vocabulary',
    icon: '📝',
    title: 'Vocabulary',
    sub: '80+ IELTS слов',
    color: 'from-teal-500/15 to-cyan-500/10 border-teal-500/30',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, refreshUser } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && user.weakAreas.length > 0) {
      setProfile({
        name: user.name,
        language: user.language as StudentProfile['language'],
        level: user.level as StudentProfile['level'],
        targetBand: user.targetBand,
        examIn: user.examIn,
        studyMinutes: user.studyMinutes,
        weakAreas: user.weakAreas as StudentProfile['weakAreas'],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        streak: user.streak,
        lessonsCompleted: user.lessonsCompleted,
        writingSubmissions: user.writingSubmissions,
        mockExamsCompleted: user.mockExamsCompleted,
        writingBands: user.writingBands.map(b => ({ date: typeof b.date === 'string' ? b.date : new Date(b.date).toISOString(), band: b.band })),
        readingScores: [],
      });
      return;
    }
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    // Sync localStorage profile to DB if DB is incomplete
    if (token && p.weakAreas && p.weakAreas.length > 0) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: p.name,
          level: p.level,
          targetBand: p.targetBand,
          examIn: p.examIn,
          studyMinutes: p.studyMinutes,
          weakAreas: p.weakAreas,
        }),
      }).then(() => refreshUser()).catch(() => {});
    }
  }, [user, loading, router, token, refreshUser]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (!profile) return null;

  const lastBand = profile.writingBands.length > 0
    ? profile.writingBands[profile.writingBands.length - 1].band.toFixed(1)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{profile.name}</h1>
        <p className="text-gray-600 text-sm mt-0.5">Цель: IELTS Band {profile.targetBand} · {profile.level}</p>
      </div>

      {/* Stats row */}
      <div className="px-5 flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: '🔥 Дней', value: profile.streak },
          { label: '📚 Уроков', value: profile.lessonsCompleted },
          { label: '✍️ Эссе', value: profile.writingSubmissions },
          ...(lastBand ? [{ label: '⭐ Балл', value: lastBand }] : []),
        ].map((s) => (
          <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-center flex-shrink-0">
            <p className="text-gold text-xl font-bold leading-none">{s.value}</p>
            <p className="text-gray-500 text-[11px] mt-1 whitespace-nowrap">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Featured: Lesson */}
      <div className="px-5 mb-5">
        <Link href="/lesson">
          <div className="bg-gradient-to-r from-violet-500/20 to-blue-500/15 border border-violet-500/40 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform">
            <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-violet-300 text-xs font-bold uppercase tracking-wide mb-1">Начни отсюда</p>
              <p className="text-white font-bold text-lg leading-tight">Урок дня</p>
              <p className="text-gray-400 text-sm mt-0.5">Персональный AI-урок · 10 минут</p>
            </div>
            <span className="text-violet-400 text-2xl">›</span>
          </div>
        </Link>
      </div>

      {/* Skills grid */}
      <div className="px-5 mb-5">
        <p className="text-gray-500 text-xs uppercase tracking-wide font-bold mb-3">Практика IELTS</p>
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((skill) => (
            <Link key={skill.href} href={skill.href}>
              <div className={`bg-gradient-to-br ${skill.color} border rounded-2xl p-4 active:scale-[0.97] transition-transform h-full`}>
                <span className="text-2xl mb-2 block">{skill.icon}</span>
                <p className="text-white font-semibold text-sm leading-tight">{skill.title}</p>
                <p className="text-gray-400 text-xs mt-1">{skill.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ask Mentora */}
      <div className="px-5 mb-2">
        <button
          onClick={() => setChatOpen(true)}
          className="w-full bg-surface-card border border-surface-border rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <span className="text-xl">🎓</span>
          <div className="flex-1 text-left">
            <p className="text-gray-300 font-medium text-sm">Спроси Mentora</p>
            <p className="text-gray-600 text-xs">Любой вопрос по IELTS</p>
          </div>
          <span className="text-gray-500 text-lg">›</span>
        </button>
      </div>

      <SocraticChat
        profile={profile}
        lessonContent={GENERAL_CONTEXT}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
