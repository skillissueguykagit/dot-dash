"use client";

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

interface Props {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  mistakes: number;
  bestStreak: number;
  problemSymbols: [string, number][];
  newAchievements: Achievement[];
  onRetry: () => void;
}

export default function ResultsPanel({
  wpm,
  rawWpm,
  accuracy,
  mistakes,
  bestStreak,
  problemSymbols,
  newAchievements,
  onRetry,
}: Props) {
  return (
    <div className="bg-bg-elev border border-border rounded-2xl p-10 mt-5">
      <h2 className="text-[13px] text-accent uppercase tracking-widest font-display mb-1">Effective WPM</h2>
      <div className="text-6xl font-extrabold font-display mb-8">{wpm}</div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { v: rawWpm, l: "Raw WPM" },
          { v: `${accuracy}%`, l: "Accuracy" },
          { v: mistakes, l: "Mistakes" },
          { v: bestStreak, l: "Best Streak" },
        ].map((c) => (
          <div key={c.l} className="bg-bg-elev-2 border border-border rounded-xl p-4">
            <div className="font-display text-xl font-extrabold">{c.v}</div>
            <div className="text-[11px] text-text-faint uppercase tracking-wider mt-0.5">{c.l}</div>
          </div>
        ))}
      </div>
      {problemSymbols.length > 0 && (
        <>
          <div className="text-xs text-text-faint uppercase tracking-wider mb-1.5">Problem symbols</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {problemSymbols.map(([sym, count]) => (
              <div key={sym} className="bg-bg-elev-2 border border-border rounded-lg px-2.5 py-1.5 font-display text-xs flex gap-1.5 items-center">
                {sym} <span className="text-red font-bold">×{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {newAchievements.length > 0 && (
        <div className="mt-4 space-y-2">
          {newAchievements.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-accent-glow border border-accent rounded-lg px-3 py-2 text-sm">
              <span className="text-xl">{a.icon}</span>
              <div>
                <div className="font-bold text-xs">Achievement Unlocked: {a.name}</div>
                <div className="text-[11px] text-text-dim">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onRetry} className="bg-accent text-bg font-bold rounded-lg px-5 py-3 text-sm mt-6">
        Retry ↻
      </button>
      <span className="text-xs text-text-faint ml-2.5">
        or press <kbd className="bg-bg-elev-2 border border-border rounded px-1.5 font-display">Esc</kbd> for a new test
      </span>
    </div>
  );
}
