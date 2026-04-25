'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, addReadingScore } from '@/lib/storage';
import { StudentProfile, ReadingPassage } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

type TFN = 'TRUE' | 'FALSE' | 'NOT GIVEN';

export default function ReadingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [answers, setAnswers] = useState<Record<number, TFN>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace('/'); return; }
    setProfile(p);
    loadPassage(p);
  }, [router]);

  const loadPassage = async (p: StudentProfile) => {
    setLoading(true);
    setError(false);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await fetch('/api/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: p }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPassage(data.passage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (id: number, ans: TFN) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: ans }));
  };

  const handleSubmit = () => {
    if (!passage) return;
    const correct = passage.questions.filter((q) => answers[q.id] === q.answer).length;
    const pct = Math.round((correct / passage.questions.length) * 100);
    setSubmitted(true);
    addReadingScore(pct);
  };

  const allAnswered = passage?.questions.every((q) => answers[q.id]) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-center justify-center animate-pulse">
          <span className="text-4xl">📖</span>
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Готовлю текст...</p>
          <p className="text-gray-500 text-sm mt-1">Генерирую академический отрывок</p>
        </div>
        <div className="flex gap-2">
          {[0, 150, 300].map((d) => (
            <div key={d} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !passage) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-5xl">😔</span>
        <p className="text-white font-semibold">Не удалось загрузить текст</p>
        <button
          onClick={() => profile && loadPassage(profile)}
          className="px-6 py-3 bg-gold text-surface font-bold rounded-xl"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const correct = passage.questions.filter((q) => answers[q.id] === q.answer).length;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Reading</p>
        <h1 className="text-xl font-bold text-white mt-1">{passage.title}</h1>
      </div>

      {/* Passage */}
      <div className="mx-5 mb-5 bg-surface-card border border-surface-border rounded-xl p-4">
        <p className="text-white text-sm leading-relaxed">{passage.text}</p>
      </div>

      {/* Score banner after submit */}
      {submitted && (
        <div className="mx-5 mb-4 bg-gold/8 border border-gold/20 rounded-xl p-4 text-center">
          <p className="text-gold font-bold text-4xl">
            {correct}/{passage.questions.length}
          </p>
          <p className="text-gray-400 text-sm mt-1">правильных ответов</p>
        </div>
      )}

      {/* Questions */}
      <div className="mx-5 space-y-4 mb-5">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">True / False / Not Given</p>
        {passage.questions.map((q) => {
          const ua = answers[q.id];
          const correct = submitted && ua === q.answer;
          const wrong = submitted && ua && ua !== q.answer;

          return (
            <div
              key={q.id}
              className={`bg-surface-card border rounded-xl p-4 transition-colors ${
                correct ? 'border-emerald-500/50' : wrong ? 'border-rose-500/50' : 'border-surface-border'
              }`}
            >
              <p className="text-white text-sm mb-3 leading-relaxed">
                <span className="text-gold font-bold">{q.id}. </span>
                {q.statement}
              </p>

              <div className="flex gap-2">
                {(['TRUE', 'FALSE', 'NOT GIVEN'] as TFN[]).map((opt) => {
                  const sel = ua === opt;
                  const isCorrectOpt = submitted && q.answer === opt;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97] ${
                        isCorrectOpt
                          ? 'bg-emerald-500 text-white'
                          : sel && wrong
                          ? 'bg-rose-500 text-white'
                          : sel
                          ? 'bg-gold text-surface'
                          : 'bg-surface border border-surface-border text-gray-400'
                      }`}
                    >
                      {opt === 'NOT GIVEN' ? 'NG' : opt}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-surface-border leading-relaxed">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="mx-5">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            Проверить ответы
          </button>
        ) : (
          <button
            onClick={() => profile && loadPassage(profile)}
            className="w-full py-4 bg-surface-card border border-gold text-gold font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Новый текст →
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
