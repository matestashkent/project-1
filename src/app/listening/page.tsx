'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';
import { StudentProfile, ListeningData } from '@/lib/types';
import { useUser } from '@/lib/userContext';
import BottomNav from '@/components/BottomNav';

type Stage = 'loading' | 'ready' | 'playing' | 'questions' | 'result';

export default function ListeningPage() {
  const router = useRouter();
  const { user, token } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [data, setData] = useState<ListeningData | null>(null);
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showPassage, setShowPassage] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p && !user) { router.replace('/'); return; }
    setProfile(p);
    loadListening(p);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [router, user]);

  const loadListening = async (p: StudentProfile | null) => {
    setStage('loading');
    setAnswers({});
    setShowPassage(false);
    setScore(null);
    setAudioUrl(null);
    setCacheId(null);

    const activeProfile = p || {
      name: user?.name || 'Student',
      language: 'ru' as const,
      level: (user?.level || 'B1-B2') as StudentProfile['level'],
      targetBand: user?.targetBand || 6.5,
      examIn: 'flexible',
      studyMinutes: 30,
      weakAreas: ['listening'] as StudentProfile['weakAreas'],
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
      const res = await fetch('/api/generate-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ profile: activeProfile }),
      });
      const result = await res.json();
      setData(result.listening);
      setCacheId(result.listening.id || null);

      // If cached audio URL already exists — set it directly
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
      }

      setStage('ready');
    } catch {
      alert('Не удалось загрузить задание. Попробуй ещё раз.');
      setStage('ready');
    }
  };

  const fetchAndPlayAudio = async () => {
    if (!data) return;

    // If we already have the audio URL — just play
    if (audioUrl) {
      playUrl(audioUrl);
      setStage('playing');
      return;
    }

    setStage('playing');
    setAudioLoading(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: data.passage, cacheId }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const result = await res.json();
      setAudioUrl(result.audioUrl);
      playUrl(result.audioUrl);
    } catch (e) {
      console.error('TTS error:', e);
      alert('Не удалось загрузить аудио. Попробуй ещё раз.');
      setStage('ready');
    } finally {
      setAudioLoading(false);
    }
  };

  const playUrl = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setStage('questions');
    audio.play();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStage('questions');
  };

  const replayAudio = () => {
    if (!audioUrl) return;
    playUrl(audioUrl);
  };

  const selectAnswer = (questionId: number, option: string) => {
    setAnswers(a => ({ ...a, [questionId]: option }));
  };

  const submitAnswers = () => {
    if (!data) return;
    let correct = 0;
    data.questions.forEach(q => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore({ correct, total: data.questions.length });
    setStage('result');
  };

  const allAnswered = data ? data.questions.every(q => answers[q.id]) : false;

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 bg-gold/10 border border-gold/30 rounded-3xl flex items-center justify-center animate-pulse">
          <span className="text-4xl">🎧</span>
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Загружаю задание...</p>
          <p className="text-gray-500 text-sm mt-1">Подготавливаю задание по Listening</p>
        </div>
        <div className="flex gap-2">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Listening</p>
        <h1 className="text-xl font-bold text-white mt-1">{data.title}</h1>
        {audioUrl && (
          <p className="text-emerald-400 text-xs mt-1">✓ Аудио готово</p>
        )}
      </div>

      {/* READY */}
      {stage === 'ready' && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <p className="text-white text-sm font-semibold mb-2">Как проходит задание:</p>
            <div className="space-y-2">
              {[
                { n: '1', t: 'Нажми "Воспроизвести" — загрузится аудио с реальным голосом' },
                { n: '2', t: 'Слушай внимательно — текст не виден во время прослушивания' },
                { n: '3', t: 'После записи появятся 5 вопросов — выбери правильный ответ' },
                { n: '4', t: 'Проверь ответы и прочитай объяснения' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="text-gold font-bold text-xs w-4 flex-shrink-0 mt-0.5">{s.n}.</span>
                  <p className="text-gray-300 text-xs leading-relaxed">{s.t}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gold/8 border border-gold/20 rounded-xl p-4">
            <p className="text-gold text-xs font-bold mb-1.5">5 вопросов после прослушивания</p>
            <p className="text-gray-400 text-xs">Тип: Multiple Choice (A / B / C / D)</p>
          </div>

          <button
            onClick={fetchAndPlayAudio}
            className="w-full py-5 bg-gold text-surface font-bold rounded-2xl text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            <span>▶</span> {audioUrl ? 'Воспроизвести' : 'Воспроизвести'}
          </button>

          <button
            onClick={() => profile && loadListening(profile)}
            className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            Другое задание
          </button>
        </div>
      )}

      {/* PLAYING */}
      {stage === 'playing' && (
        <div className="mx-5 space-y-4">
          {audioLoading ? (
            <div className="text-center py-10">
              <div className="w-24 h-24 bg-gold/10 border-2 border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-4xl">⏳</span>
              </div>
              <p className="text-white font-semibold text-lg">Загружаю аудио...</p>
              <p className="text-gray-500 text-sm mt-1">Подготавливаю качественную запись</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-24 h-24 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl animate-pulse">🔊</span>
              </div>
              <p className="text-white font-semibold text-lg">Слушай внимательно</p>
              <p className="text-gray-500 text-sm mt-1">Текст не виден — как на реальном экзамене</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={replayAudio}
              disabled={audioLoading || !audioUrl}
              className="flex-1 py-4 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98] disabled:opacity-40"
            >
              Повторить
            </button>
            <button
              onClick={stopAudio}
              disabled={audioLoading}
              className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl text-base active:scale-[0.98] disabled:opacity-40"
            >
              Перейти к вопросам
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONS */}
      {stage === 'questions' && (
        <div className="mx-5 space-y-4">
          <div className="flex gap-3 mb-2">
            <button
              onClick={replayAudio}
              disabled={!audioUrl}
              className="flex-1 py-3 bg-surface-card border border-surface-border text-gray-400 text-sm font-medium rounded-xl active:scale-[0.98] disabled:opacity-40"
            >
              🔊 Слушать снова
            </button>
          </div>

          {data.questions.map((q) => (
            <div key={q.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <p className="text-white text-sm font-semibold mb-3">
                <span className="text-gold mr-2">{q.id}.</span>{q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(q.id, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98] border ${
                        selected
                          ? 'bg-gold/15 border-gold text-gold'
                          : 'bg-surface border-surface-border text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={submitAnswers}
            disabled={!allAnswered}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
          >
            Проверить ответы →
          </button>
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && score && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-gold/30 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">Результат</p>
            <p className="text-6xl font-bold text-gold mt-1">{score.correct}/{score.total}</p>
            <p className="text-gray-500 text-sm mt-1">
              {score.correct === score.total ? 'Отлично! Все ответы верны' :
               score.correct >= 4 ? 'Хорошо!' :
               score.correct >= 3 ? 'Неплохо, продолжай тренироваться' :
               'Нужно больше практики'}
            </p>
          </div>

          {data.questions.map((q) => {
            const selected = answers[q.id];
            const correct = selected === q.answer;
            return (
              <div
                key={q.id}
                className={`bg-surface-card border rounded-xl p-4 ${correct ? 'border-emerald-500/30' : 'border-rose-500/30'}`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{correct ? '✅' : '❌'}</span>
                  <p className="text-white text-sm font-medium">{q.question}</p>
                </div>
                {!correct && (
                  <p className="text-rose-400 text-xs mb-1">Твой ответ: {selected}</p>
                )}
                <p className="text-emerald-400 text-xs font-medium mb-1">
                  Правильно: {q.answer}
                </p>
                <p className="text-gray-500 text-xs leading-relaxed">{q.explanation}</p>
              </div>
            );
          })}

          <button
            onClick={() => setShowPassage(!showPassage)}
            className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 text-sm font-medium rounded-xl active:scale-[0.98]"
          >
            {showPassage ? 'Скрыть текст' : 'Показать текст записи'}
          </button>

          {showPassage && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <p className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">Текст записи</p>
              <p className="text-gray-300 text-sm leading-relaxed">{data.passage}</p>
            </div>
          )}

          {audioUrl && (
            <button
              onClick={replayAudio}
              className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 text-sm font-medium rounded-xl active:scale-[0.98]"
            >
              🔊 Прослушать ещё раз
            </button>
          )}

          <button
            onClick={() => profile && loadListening(profile)}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Новое задание
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
