'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, saveProfile } from '@/lib/storage';
import { StudentProfile, WeakArea } from '@/lib/types';

type Step = 'welcome' | 'name' | 'level' | 'band' | 'examDate' | 'studyTime' | 'weakAreas' | 'creating';

const STEPS: Step[] = ['welcome', 'name', 'level', 'band', 'examDate', 'studyTime', 'weakAreas', 'creating'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [form, setForm] = useState({
    name: '',
    level: '',
    targetBand: 0,
    examIn: '',
    studyMinutes: 0,
    weakAreas: [] as WeakArea[],
  });

  useEffect(() => {
    if (getProfile()) router.replace('/dashboard');
  }, [router]);

  const next = () => {
    const idx = STEPS.indexOf(step);
    setStep(STEPS[idx + 1]);
  };

  const toggleWeakArea = (area: WeakArea) => {
    setForm((f) => ({
      ...f,
      weakAreas: f.weakAreas.includes(area)
        ? f.weakAreas.filter((a) => a !== area)
        : [...f.weakAreas, area],
    }));
  };

  const createProfile = () => {
    const profile: StudentProfile = {
      name: form.name,
      language: 'ru',
      level: form.level as StudentProfile['level'],
      targetBand: form.targetBand,
      examIn: form.examIn,
      studyMinutes: form.studyMinutes,
      weakAreas: form.weakAreas.length > 0 ? form.weakAreas : ['writing', 'reading'],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      streak: 1,
      lessonsCompleted: 0,
      writingSubmissions: 0,
      mockExamsCompleted: 0,
      writingBands: [],
      readingScores: [],
    };
    saveProfile(profile);
    setStep('creating');
    setTimeout(() => router.replace('/dashboard'), 2200);
  };

  const stepIndex = STEPS.indexOf(step);
  const progressPct = stepIndex > 0 && stepIndex < STEPS.length - 1 ? (stepIndex / (STEPS.length - 2)) * 100 : 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Progress bar */}
      {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
        <div className="h-0.5 bg-surface-border">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="text-center space-y-6 max-w-xs w-full">
            <div className="w-20 h-20 bg-gold/10 border border-gold/30 rounded-3xl flex items-center justify-center mx-auto">
              <span className="text-4xl">🎓</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gold">Устоз</h1>
              <p className="text-gray-400 mt-1">AI IELTS Репетитор</p>
            </div>
            <p className="text-white text-base leading-relaxed">
              Привет! Я твой личный репетитор по IELTS. Помогу получить нужный балл — в 5 раз дешевле живого репетитора.
            </p>
            <p className="text-gray-500 text-sm">Займёт 1 минуту — задам 6 вопросов</p>
            <button
              onClick={next}
              className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-lg active:scale-95 transition-transform"
            >
              Начать →
            </button>
          </div>
        )}

        {/* NAME */}
        {step === 'name' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 1 из 6</p>
              <h2 className="text-2xl font-bold text-white">Как тебя зовут?</h2>
            </div>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && form.name.trim() && next()}
              placeholder="Твоё имя..."
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-4 text-white text-lg outline-none focus:border-gold transition-colors"
            />
            <button
              onClick={next}
              disabled={!form.name.trim()}
              className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-lg disabled:opacity-30 active:scale-95 transition-all"
            >
              Далее →
            </button>
          </div>
        )}

        {/* LEVEL */}
        {step === 'level' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 2 из 6</p>
              <h2 className="text-2xl font-bold text-white">{form.name}, твой уровень?</h2>
              <p className="text-gray-500 text-sm mt-1">Будь честным — это важно для плана</p>
            </div>
            <div className="space-y-3">
              {[
                { v: 'A1-A2', label: 'Начинающий', desc: 'Базовая грамматика, маленький словарь' },
                { v: 'B1-B2', label: 'Средний', desc: 'Могу общаться, но делаю ошибки' },
                { v: 'C1-C2', label: 'Продвинутый', desc: 'Уверенно, нужна тонкая доработка' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setForm((f) => ({ ...f, level: opt.v })); next(); }}
                  className="w-full text-left p-4 bg-surface-card border border-surface-border hover:border-gold rounded-xl transition-colors active:scale-[0.98]"
                >
                  <p className="text-white font-semibold">
                    {opt.label} <span className="text-gold text-sm">({opt.v})</span>
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TARGET BAND */}
        {step === 'band' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 3 из 6</p>
              <h2 className="text-2xl font-bold text-white">Нужный балл IELTS?</h2>
            </div>
            <div className="space-y-3">
              {[
                { v: 5.5, label: '5.5', desc: 'Базовые требования, рабочая виза' },
                { v: 6.0, label: '6.0', desc: 'Большинство университетов' },
                { v: 6.5, label: '6.5', desc: 'Хорошие программы за рубежом' },
                { v: 7.0, label: '7.0', desc: 'Топ-университеты' },
                { v: 7.5, label: '7.5+', desc: 'Медицина, право, элитные вузы' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setForm((f) => ({ ...f, targetBand: opt.v })); next(); }}
                  className="w-full text-left p-4 bg-surface-card border border-surface-border hover:border-gold rounded-xl transition-colors flex items-center gap-4 active:scale-[0.98]"
                >
                  <span className="text-gold font-bold text-2xl w-12 text-center">{opt.label}</span>
                  <span className="text-gray-400 text-sm">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EXAM DATE */}
        {step === 'examDate' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 4 из 6</p>
              <h2 className="text-2xl font-bold text-white">Когда сдаёшь?</h2>
            </div>
            <div className="space-y-3">
              {[
                { v: '1month', label: 'Через 1 месяц', desc: 'Нужна интенсивная программа' },
                { v: '2-3months', label: 'Через 2–3 месяца', desc: 'Стандартный темп' },
                { v: '3-6months', label: 'Через 3–6 месяцев', desc: 'Комфортный темп' },
                { v: 'flexible', label: 'Пока не знаю', desc: 'Учусь в своём темпе' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setForm((f) => ({ ...f, examIn: opt.v })); next(); }}
                  className="w-full text-left p-4 bg-surface-card border border-surface-border hover:border-gold rounded-xl transition-colors active:scale-[0.98]"
                >
                  <p className="text-white font-semibold">{opt.label}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STUDY TIME */}
        {step === 'studyTime' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 5 из 6</p>
              <h2 className="text-2xl font-bold text-white">Время в день?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 15, label: '15 мин', desc: 'Лёгкий старт' },
                { v: 30, label: '30 мин', desc: 'Оптимально' },
                { v: 60, label: '1 час', desc: 'Хороший темп' },
                { v: 120, label: '2+ часа', desc: 'Интенсивно' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setForm((f) => ({ ...f, studyMinutes: opt.v })); next(); }}
                  className="p-5 bg-surface-card border border-surface-border hover:border-gold rounded-xl transition-colors text-center active:scale-[0.97]"
                >
                  <p className="text-gold font-bold text-2xl">{opt.label}</p>
                  <p className="text-gray-500 text-xs mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WEAK AREAS */}
        {step === 'weakAreas' && (
          <div className="w-full max-w-xs space-y-5">
            <div>
              <p className="text-gray-500 text-sm mb-1">Вопрос 6 из 6</p>
              <h2 className="text-2xl font-bold text-white">Что улучшаем?</h2>
              <p className="text-gray-500 text-sm mt-1">Можно выбрать несколько</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'writing' as WeakArea, icon: '✍️', label: 'Writing' },
                { v: 'reading' as WeakArea, icon: '📖', label: 'Reading' },
                { v: 'listening' as WeakArea, icon: '🎧', label: 'Listening' },
                { v: 'speaking' as WeakArea, icon: '🗣️', label: 'Speaking' },
              ].map((opt) => {
                const sel = form.weakAreas.includes(opt.v);
                return (
                  <button
                    key={opt.v}
                    onClick={() => toggleWeakArea(opt.v)}
                    className={`p-5 rounded-xl border transition-all text-center active:scale-[0.97] ${
                      sel
                        ? 'bg-gold/10 border-gold text-gold'
                        : 'bg-surface-card border-surface-border text-gray-500'
                    }`}
                  >
                    <p className="text-3xl">{opt.icon}</p>
                    <p className="font-semibold mt-2 text-sm">{opt.label}</p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={createProfile}
              disabled={form.weakAreas.length === 0}
              className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-lg disabled:opacity-30 active:scale-95 transition-all"
            >
              Создать мой план →
            </button>
          </div>
        )}

        {/* CREATING */}
        {step === 'creating' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gold/10 border border-gold/30 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <span className="text-5xl">🎓</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Создаём план...</h2>
              <p className="text-gray-500 mt-2">Персонализируем программу под тебя</p>
            </div>
            <div className="flex justify-center gap-2">
              {[0, 150, 300].map((d) => (
                <div
                  key={d}
                  className="w-3 h-3 bg-gold rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
