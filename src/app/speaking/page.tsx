'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';
import { StudentProfile, SpeakingFeedback } from '@/lib/types';
import { SPEAKING_CUES, CueCard } from '@/lib/prompts';
import { useUser } from '@/lib/userContext';
import BottomNav from '@/components/BottomNav';
import SpeakingFeedbackDisplay from '@/components/SpeakingFeedback';

type Stage = 'cue' | 'prep' | 'recording' | 'reviewing' | 'checking' | 'result';

export default function SpeakingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [cue, setCue] = useState<CueCard | null>(null);
  const [stage, setStage] = useState<Stage>('cue');
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [supported, setSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p && !user) { router.replace('/'); return; }
    setProfile(p);
    pickCue();
    // Check SpeechRecognition support
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setSupported(false);
    }
  }, [router, user]);

  const pickCue = () => {
    setCue(SPEAKING_CUES[Math.floor(Math.random() * SPEAKING_CUES.length)]);
    setStage('cue');
    setTranscript('');
    setInterimText('');
    setFeedback(null);
  };

  // Prep countdown
  useEffect(() => {
    if (stage !== 'prep') return;
    setPrepSeconds(60);
    prepTimerRef.current = setInterval(() => {
      setPrepSeconds(s => {
        if (s <= 1) { clearInterval(prepTimerRef.current!); setStage('recording'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(prepTimerRef.current!);
  }, [stage]);

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    let finalTranscript = '';

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t + ' ';
        else interim = t;
      }
      setTranscript(finalTranscript);
      setInterimText(interim);
    };

    rec.onend = () => {
      // Restart if still recording
      if (recognitionRef.current === rec && isRecording) {
        try { rec.start(); } catch {}
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  };

  useEffect(() => {
    if (stage === 'recording') startRecording();
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setStage('reviewing');
  };

  const handleSubmit = async () => {
    const finalText = (transcript + ' ' + interimText).trim();
    if (!finalText || !cue) return;
    setStage('checking');

    const activeProfile = profile || {
      name: user?.name || 'Student',
      language: 'ru' as const,
      level: (user?.level || 'B1-B2') as StudentProfile['level'],
      targetBand: user?.targetBand || 6.5,
      examIn: 'flexible',
      studyMinutes: 30,
      weakAreas: ['speaking'] as StudentProfile['weakAreas'],
      createdAt: '',
      lastActive: '',
      streak: 0,
      lessonsCompleted: 0,
      writingSubmissions: 0,
      mockExamsCompleted: 0,
      writingBands: [],
      readingScores: [],
    };

    try {
      const res = await fetch('/api/check-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: activeProfile, cue, transcript: finalText }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
      setStage('result');
    } catch {
      alert('Ошибка при проверке. Попробуй ещё раз.');
      setStage('reviewing');
    }
  };

  if (!cue) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Speaking</p>
        <h1 className="text-xl font-bold text-white mt-1">Part 2 — Монолог</h1>
      </div>

      {/* CUE CARD */}
      {stage === 'cue' && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-gold text-xs font-bold mb-3 uppercase tracking-wide">Cue Card</p>
            <p className="text-white font-semibold text-base mb-4">{cue.topic}</p>
            <p className="text-gray-500 text-xs mb-2">You should say:</p>
            <div className="space-y-1.5">
              {cue.points.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gold text-xs mt-0.5">•</span>
                  <p className="text-gray-300 text-sm">{p}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gold/8 border border-gold/20 rounded-xl p-4">
            <p className="text-gold text-xs font-bold mb-1.5">Как это работает:</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              1 минута на подготовку → 2 минуты говоришь → получаешь фидбек по 4 критериям IELTS
            </p>
          </div>

          {!supported && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
              <p className="text-rose-400 text-xs font-bold mb-1">Микрофон не поддерживается</p>
              <p className="text-gray-400 text-xs">Используй Chrome на Android или десктопе. На iOS откроется режим ввода текста.</p>
            </div>
          )}

          <button
            onClick={() => setStage('prep')}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Начать подготовку (1 мин) →
          </button>
          <button
            onClick={pickCue}
            className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            Другая тема
          </button>
        </div>
      )}

      {/* PREP */}
      {stage === 'prep' && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-gold text-xs font-bold mb-3 uppercase tracking-wide">Cue Card</p>
            <p className="text-white font-semibold text-base mb-3">{cue.topic}</p>
            {cue.points.map((p, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <span className="text-gold text-xs mt-0.5">•</span>
                <p className="text-gray-300 text-sm">{p}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-2">Время на подготовку</p>
            <p className="text-8xl font-bold text-gold tabular-nums">{prepSeconds}</p>
            <p className="text-gray-500 text-sm mt-2">секунд</p>
          </div>

          <button
            onClick={() => { clearInterval(prepTimerRef.current!); setStage('recording'); }}
            className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Готов — начать запись
          </button>
        </div>
      )}

      {/* RECORDING */}
      {stage === 'recording' && (
        <div className="mx-5 space-y-4">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-rose-500/15 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-4xl">🎙️</span>
            </div>
            <p className="text-white font-semibold text-lg">Запись идёт...</p>
            <p className="text-gray-500 text-sm mt-1">Говори на английском, 1–2 минуты</p>
          </div>

          {/* Live transcript */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 min-h-24">
            <p className="text-gray-500 text-xs mb-2">Твои слова:</p>
            <p className="text-white text-sm leading-relaxed">
              {transcript}
              <span className="text-gray-500">{interimText}</span>
            </p>
            {!transcript && !interimText && (
              <p className="text-gray-600 text-sm italic">Начни говорить...</p>
            )}
          </div>

          {/* Fallback: if no speech API */}
          {!supported && (
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Запиши свой ответ текстом..."
              className="w-full h-32 bg-surface-card border border-surface-border rounded-xl p-4 text-white text-sm outline-none focus:border-gold resize-none"
            />
          )}

          <button
            onClick={stopRecording}
            className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Остановить запись
          </button>
        </div>
      )}

      {/* REVIEWING */}
      {stage === 'reviewing' && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-white text-xs font-bold mb-2 uppercase tracking-wide">Твой ответ</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {(transcript + ' ' + interimText).trim() || 'Текст не распознан'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('recording')}
              className="flex-1 py-4 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98] transition-transform"
            >
              Записать снова
            </button>
            <button
              onClick={handleSubmit}
              disabled={!(transcript + interimText).trim()}
              className="flex-1 py-4 bg-gold text-surface font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
            >
              Проверить →
            </button>
          </div>
        </div>
      )}

      {/* CHECKING */}
      {stage === 'checking' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-white font-semibold">Анализирую ответ...</p>
          <p className="text-gray-500 text-sm">Оцениваю по 4 критериям IELTS</p>
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && feedback && (
        <div className="mx-5 space-y-4">
          <SpeakingFeedbackDisplay feedback={feedback} />
          <button
            onClick={pickCue}
            className="w-full py-4 bg-surface-card border border-gold text-gold font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Новая тема
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
