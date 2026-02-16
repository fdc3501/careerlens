interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

function getLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: 'Strong', color: 'text-strong', bgColor: 'bg-strong' };
  if (score >= 40) return { label: 'Stable', color: 'text-stable', bgColor: 'bg-stable' };
  return { label: 'Weak', color: 'text-weak', bgColor: 'bg-weak' };
}

export function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const level = getLevel(score);
  const pct = Math.min((score / maxScore) * 100, 100);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{score}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${level.color} bg-opacity-10 ${level.bgColor}/15`}>
            {level.label}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${level.bgColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
