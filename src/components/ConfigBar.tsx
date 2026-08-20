"use client";

import clsx from "clsx";
import { AMOUNT_DEFAULT, AMOUNT_OPTIONS, amountKind, amountUnit, type PracticeMode } from "@/lib/morse";

const MODES: { id: PracticeMode; label: string }[] = [
  { id: "letters", label: "Letters" },
  { id: "words", label: "Words" },
  { id: "sentences", label: "Sentences" },
  { id: "numbers", label: "Numbers" },
  { id: "mixed", label: "Mixed" },
];

const DURATIONS = [15, 30, 60, 120];

function Seg({ children }: { children: React.ReactNode }) {
  return <div className="flex bg-bg-elev border border-border rounded-lg p-0.5 gap-0.5">{children}</div>;
}
function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-xs font-semibold px-3 py-1.5 rounded-md transition",
        active ? "bg-accent text-bg" : "text-text-dim hover:text-text"
      )}
    >
      {children}
    </button>
  );
}

interface Props {
  mode: PracticeMode;
  len: number;
  duration: number;
  onChange: (mode: PracticeMode, len: number, duration: number) => void;
}

export default function ConfigBar({ mode, len, duration, onChange }: Props) {
  const kind = amountKind(mode);
  const unit = amountUnit(mode);
  const amounts = AMOUNT_OPTIONS[kind];

  return (
    <div className="space-y-5 mb-5">
      <div>
        <div className="text-center text-[11px] uppercase tracking-widest text-text-faint font-display mb-2.5">
          What to type
        </div>
        <div className="flex justify-center flex-wrap gap-2">
          <Seg>
            {MODES.map((m) => (
              <SegBtn key={m.id} active={mode === m.id} onClick={() => onChange(m.id, AMOUNT_DEFAULT[amountKind(m.id)], duration)}>
                {m.label}
              </SegBtn>
            ))}
          </Seg>
        </div>
      </div>
      <div>
        <div className="text-center text-[11px] uppercase tracking-widest text-text-faint font-display mb-2.5">
          Amount, against the clock
        </div>
        <div className="flex justify-center flex-wrap gap-2">
          <Seg>
            {amounts.map((n) => (
              <SegBtn key={n} active={len === n} onClick={() => onChange(mode, n, duration)}>
                {n} {unit}
              </SegBtn>
            ))}
          </Seg>
          <Seg>
            {DURATIONS.map((d) => (
              <SegBtn key={d} active={duration === d} onClick={() => onChange(mode, len, d)}>
                {d}s
              </SegBtn>
            ))}
          </Seg>
        </div>
      </div>
    </div>
  );
}
