'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';
import { useUser } from '@/lib/userContext';
import {
  VocabWord, buildSession, getLearnedIds, markLearned, resetVocab,
  VOCAB_WORDS, TOPICS,
} from '@/lib/vocabulary';
import BottomNav from '@/components/BottomNav';

type Stage = 'intro' | 'card' | 'done';

const TYPE_LABEL: Record<string, string> = {
  noun: 'существительное',
  verb: 'глагол',
  adj: 'прилагательное',
  adv: 'наречие',
  phrase: 'фраза',
  conj: 'союз',
};

const TOPIC_COLOR: Record<string, string> = {
  Environment: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  Technology:  'text-blue-400 bg-blue-500/10 border-blue-500/25',
  Society:     'text-purple-400 bg-purple-500/10 border-purple-500/25',
  Education:   'text-sky-400 bg-sky-500/10 border-sky-500/25',
  Economy:     'text-amber-400 bg-amber-500/10 border-amber-500/25',
  Health:      'text-rose-400 bg-rose-500/10 border-rose-500/25',
  Academic:    'text-gold bg-gold/10 border-gold/25',
};

export default function VocabularyPage() {
  const router = useRouter();
  const { user } = useUser();

  const [stage, setStage] = useState<Stage>('intro');
  const [selectedTopic, setSelectedTopic] = useState('Все');
  const [queue, setQueue] = useState<VocabWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [sessionLearned, setSessionLearned] = useState(0);
  const [totalLearned, setTotalLearned] = useState(0);

  useEffect(() => {
    const p = getProfile();
    if (!p && !user) { router.replace('/'); return; }
    setTotalLearned(getLearnedIds().size);
  }, [router, user]);

  const startSession = () => {
    let words: VocabWord[];
    if (selectedTopic === 'Все') {
      words = buildSession();
    } else {
      const filtered = VOCAB_WORDS.filter(w => w.topic === selectedTopic);
      const learned = getLearnedIds();
      const unlearned = filtered.filter(w => !learned.has(w.id));
      const review = filtered.filter(w => learned.has(w.id));
      const shuffle = (a: VocabWord[]) => [...a].sort(() => Math.random() - 0.5);
      words = shuffle([...shuffle(unlearned).slice(0, 12), ...shuffle(review).slice(0, 3)]);
    }
    setQueue(words);
    setCurrentIdx(0);
    setFlipped(false);
    setLearnedCount(0);
    setSessionLearned(0);
    setStage('card');
  };

  const handleKnow = () => {
    const word = queue[currentIdx];
    const wasNew = !getLearnedIds().has(word.id);
    markLearned(word.id);
    if (wasNew) {
      setSessionLearned(s => s + 1);
      setTotalLearned(getLearnedIds().size);
    }
    next();
  };

  const handleAgain = () => {
    // Move current card to end of queue
    setQueue(q => {
      const updated = [...q];
      const [card] = updated.splice(currentIdx, 1);
      updated.push(card);
      return updated;
    });
    setFlipped(false);
  };

  const next = () => {
    if (currentIdx + 1 >= queue.length) {
      setStage('done');
    } else {
      setCurrentIdx(i => i + 1);
      setFlipped(false);
    }
  };

  const currentWord = queue[currentIdx];
  const progress = queue.length > 0 ? Math.round((currentIdx / queue.length) * 100) : 0;
  const totalWords = VOCAB_WORDS.length;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="px-5 pt-10 pb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">IELTS Vocabulary</p>
        <h1 className="text-xl font-bold text-white mt-1">Словарный модуль</h1>
      </div>

      {/* INTRO */}
      {stage === 'intro' && (
        <div className="mx-5 space-y-4">
          {/* Stats */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Выучено слов</p>
              <p className="text-gold text-3xl font-bold mt-0.5">{totalLearned}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Всего в базе</p>
              <p className="text-white text-3xl font-bold mt-0.5">{totalWords}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${Math.round((totalLearned / totalWords) * 100)}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1.5 text-right">
              {Math.round((totalLearned / totalWords) * 100)}% завершено
            </p>
          </div>

          {/* Topic filter */}
          <div>
            <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wide">Тема</p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTopic === t
                      ? 'bg-gold text-surface border-gold'
                      : 'bg-surface-card border-surface-border text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gold/8 border border-gold/20 rounded-xl p-4">
            <p className="text-gold text-xs font-bold mb-2">Как это работает:</p>
            <div className="space-y-1.5">
              {[
                '🃏 Видишь слово → вспоминаешь значение → переворачиваешь карточку',
                '✅ "Знаю" — слово помечается как выученное',
                '🔄 "Ещё раз" — слово вернётся в конце сессии',
                '📈 Выученные слова изредка появляются для повторения',
              ].map((t, i) => (
                <p key={i} className="text-gray-400 text-xs leading-relaxed">{t}</p>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Начать сессию →
          </button>

          {totalLearned > 0 && (
            <button
              onClick={() => { if (confirm('Сбросить весь прогресс словаря?')) { resetVocab(); setTotalLearned(0); } }}
              className="w-full py-3 bg-surface-card border border-surface-border text-gray-600 text-sm rounded-xl active:scale-[0.98]"
            >
              Сбросить прогресс словаря
            </button>
          )}
        </div>
      )}

      {/* CARD */}
      {stage === 'card' && currentWord && (
        <div className="mx-5 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{currentIdx + 1} / {queue.length}</span>
              <span>{sessionLearned} выучено</span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Flashcard */}
          <div
            onClick={() => setFlipped(f => !f)}
            className="bg-surface-card border border-surface-border rounded-2xl p-6 min-h-64 flex flex-col active:scale-[0.99] transition-transform cursor-pointer select-none"
          >
            {/* Topic badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${TOPIC_COLOR[currentWord.topic] || 'text-gray-400 bg-surface border-surface-border'}`}>
                {currentWord.topic}
              </span>
              <span className="text-gray-600 text-xs">{flipped ? 'Нажми снова' : 'Нажми чтобы перевернуть'}</span>
            </div>

            {!flipped ? (
              /* Front: word */
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <p className="text-4xl font-bold text-white text-center">{currentWord.word}</p>
                <p className="text-gray-500 text-sm italic">{TYPE_LABEL[currentWord.type] || currentWord.type}</p>
              </div>
            ) : (
              /* Back: definition + example */
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wide">Значение</p>
                  <p className="text-gold text-lg font-semibold leading-snug">{currentWord.definition}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wide">Пример (IELTS)</p>
                  <p className="text-gray-300 text-sm leading-relaxed italic">{currentWord.example}</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          {flipped ? (
            <div className="flex gap-3">
              <button
                onClick={handleAgain}
                className="flex-1 py-4 bg-surface-card border border-surface-border text-gray-400 font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
              >
                🔄 Ещё раз
              </button>
              <button
                onClick={handleKnow}
                className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
              >
                ✓ Знаю
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-600 text-sm">
              Вспомни значение, затем переверни карточку
            </p>
          )}

          {/* Skip */}
          <button
            onClick={() => setStage('intro')}
            className="w-full py-2 text-gray-600 text-xs active:scale-[0.98]"
          >
            Завершить сессию
          </button>
        </div>
      )}

      {/* DONE */}
      {stage === 'done' && (
        <div className="mx-5 space-y-4">
          <div className="bg-surface-card border border-gold/30 rounded-2xl p-6 text-center">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-white font-bold text-xl">Сессия завершена!</p>
            <p className="text-gray-400 text-sm mt-2">
              В этой сессии выучено: <span className="text-gold font-bold">{sessionLearned}</span> слов
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Всего выучено: <span className="text-gold font-bold">{getLearnedIds().size}</span> / {totalWords}
            </p>
          </div>

          {/* Overall progress */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Общий прогресс</span>
              <span>{Math.round((getLearnedIds().size / totalWords) * 100)}%</span>
            </div>
            <div className="h-2 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full"
                style={{ width: `${Math.round((getLearnedIds().size / totalWords) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 bg-gold text-surface font-bold rounded-2xl text-base active:scale-[0.98] transition-transform"
          >
            Ещё одна сессия →
          </button>
          <button
            onClick={() => setStage('intro')}
            className="w-full py-3 bg-surface-card border border-surface-border text-gray-400 font-medium rounded-2xl text-sm active:scale-[0.98]"
          >
            На главную словаря
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
