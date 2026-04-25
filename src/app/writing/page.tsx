'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, addWritingBand } from '@/lib/storage';
import { StudentProfile, WritingFeedback } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import WritingFeedbackDisplay from '@/components/WritingFeedback';

const PROMPTS = [
  "Some people think that technology has made our lives more complicated. Others believe it has made life easier. Discuss both views and give your own opinion.",
  "In many countries, young people are leaving rural areas and moving to cities. What are the causes of this? What problems does it create?",
  "Some people believe that competitive sports should not be part of the school curriculum. To what extent do you agree or disagree?",
  "Many governments prioritise economic development over protecting the environment. Do you think this is a positive or negative development?",
  "Some people think parents should monitor children's internet use closely. Others say children should have more freedom online. Discuss both views.",
  "Universities should accept equal numbers of male and female students in every subject. To what extent do you agree or disagree?",
  "International tourism has brought great benefits to many places. However, it has also caused serious problems. Do the advantages outweigh the disadvantages?",
];

export default function WritingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    pickPrompt();
  }, [router]);

  const pickPrompt = () => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  };

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const minWords = 250;
  const ready = wordCount >= minWords;

  const handleSubmit = async () => {
    if (!profile || !ready || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/check-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, prompt, essay }),
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
    setEssay('');
    pickPrompt();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Writing</p>
        <h1 className="text-xl font-bold text-white mt-1">Task 2 — Эссе</h1>
      </div>

      {/* Task prompt */}
      <div className="mx-5 mb-4 bg-surface-card border border-surface-border rounded-xl p-4">
        <p className="text-gold text-xs font-bold mb-2 uppercase tracking-wide">Задание</p>
        <p className="text-white text-sm leading-relaxed">{prompt}</p>
        <p className="text-gray-600 text-xs mt-3">Minimum 250 words · Task 2 · 40 minutes</p>
      </div>

      {!feedback ? (
        <>
          {/* Essay textarea */}
          <div className="mx-5 mb-3">
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Начни писать эссе здесь..."
              className="w-full h-60 bg-surface-card border border-surface-border rounded-xl p-4 text-white text-sm leading-relaxed outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          {/* Word count */}
          <div className="mx-5 mb-5 flex items-center justify-between">
            <span className={`text-sm font-medium ${ready ? 'text-emerald-400' : 'text-gray-500'}`}>
              {wordCount} слов{!ready && ` — ещё ${minWords - wordCount}`}
            </span>
            {ready && <span className="text-emerald-400 text-sm">✓ Готово</span>}
          </div>

          {/* Submit */}
          <div className="mx-5">
            <button
              onClick={handleSubmit}
              disabled={!ready || loading}
              className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                  Проверяю эссе...
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
          <div className="mx-5 space-y-3">
            <button
              onClick={reset}
              className="w-full py-4 bg-surface-card border border-gold text-gold font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
            >
              Написать ещё эссе
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
