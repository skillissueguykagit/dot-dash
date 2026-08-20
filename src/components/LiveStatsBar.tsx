"use client";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center font-display">
      <div className="text-2xl font-extrabold text-accent">{value}</div>
      <div className="text-[10.5px] text-text-faint uppercase tracking-wider">{label}</div>
    </div>
  );
}

interface Props {
  wpm: number;
  accuracy: number;
  streak: number;
  mistakes: number;
  progress: string;
  progressLabel: string;
  timeLeft: number;
}

export default function LiveStatsBar({ wpm, accuracy, streak, mistakes, progress, progressLabel, timeLeft }: Props) {
  return (
    <div className="flex justify-center gap-9 flex-wrap mt-6">
      <Stat value={wpm} label="WPM" />
      <Stat value={`${accuracy}%`} label="Accuracy" />
      <Stat value={streak} label="Streak" />
      <Stat value={mistakes} label="Mistakes" />
      <Stat value={progress} label={progressLabel} />
      <Stat value={`${timeLeft}s`} label="Time Left" />
    </div>
  );
}
