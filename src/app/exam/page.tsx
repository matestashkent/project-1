'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/storage';
import BottomNav from '@/components/BottomNav';

export default function ExamPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getProfile()) router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Mock Exam</p>
        <h1 className="text-xl font-bold text-white mt-1">Симуляционный экзамен</h1>
      </div>

      <div className="mx-5 space-y-4">
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-4">
          <p className="text-gold font-semibold mb-1">Скоро будет доступно</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Полный Mock Exam с Writing Task 1 + Task 2, Reading и Speaking — в следующем обновлении.
          </p>
        </div>

        <p className="text-gray-500 text-sm text-center">Пока тренируйся в отдельных модулях:</p>

        <Link href="/writing">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform mt-3">
            <span className="text-3xl">✍️</span>
            <div className="flex-1">
              <p className="text-white font-semibold">Writing Practice</p>
              <p className="text-gray-400 text-sm">Task 2 эссе + AI оценка</p>
            </div>
            <span className="text-gray-500">›</span>
          </div>
        </Link>

        <Link href="/reading">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
            <span className="text-3xl">📖</span>
            <div className="flex-1">
              <p className="text-white font-semibold">Reading Practice</p>
              <p className="text-gray-400 text-sm">True / False / Not Given</p>
            </div>
            <span className="text-gray-500">›</span>
          </div>
        </Link>

        <Link href="/lesson">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
            <span className="text-3xl">📚</span>
            <div className="flex-1">
              <p className="text-white font-semibold">Урок дня</p>
              <p className="text-gray-400 text-sm">Персональный AI-урок</p>
            </div>
            <span className="text-gray-500">›</span>
          </div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
