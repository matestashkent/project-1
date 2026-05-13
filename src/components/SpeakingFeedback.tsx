import { SpeakingFeedback } from '@/lib/types';

interface Props { feedback: SpeakingFeedback }

const LABELS: Record<string, string> = {
  fluencyCoherence: 'Fluency & Coherence',
  lexicalResource: 'Lexical Resource',
  grammaticalRange: 'Grammatical Range',
  pronunciation: 'Pronunciation',
};

function BandBar({ band }: { band: number }) {
  const pct = Math.max(0, Math.min(100, ((band - 4) / 5) * 100));
  const color = band >= 7 ? '#22c55e' : band >= 6 ? '#C9A227' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold w-8 text-right" style={{ color }}>{band.toFixed(1)}</span>
    </div>
  );
}

export default function SpeakingFeedbackDisplay({ feedback }: Props) {
  const criteria = ['fluencyCoherence', 'lexicalResource', 'grammaticalRange', 'pronunciation'] as const;
  return (
    <div className="space-y-3">
      <div className="bg-surface-card border border-gold/30 rounded-2xl p-5 text-center">
        <p className="text-gray-400 text-sm">Общая оценка</p>
        <p className="text-6xl font-bold text-gold mt-1">{feedback.overallBand.toFixed(1)}</p>
        <p className="text-gray-500 text-sm mt-1">Band Score</p>
      </div>
      {criteria.map((key) => {
        const item = feedback[key];
        return (
          <div key={key} className="bg-surface-card border border-surface-border rounded-2xl p-4 space-y-2.5">
            <p className="text-white font-medium text-sm">{LABELS[key]}</p>
            <BandBar band={item.band} />
            <p className="text-gray-300 text-sm leading-relaxed">{item.comment}</p>
            {item.quote && (
              <p className="text-xs text-gray-500 italic border-l-2 border-gold/40 pl-3 leading-relaxed">
                &quot;{item.quote}&quot;
              </p>
            )}
          </div>
        );
      })}
      <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4">
        <p className="text-gold text-xs font-bold mb-1.5">💡 ГЛАВНЫЙ СОВЕТ</p>
        <p className="text-white text-sm leading-relaxed">{feedback.topTip}</p>
      </div>
    </div>
  );
}
