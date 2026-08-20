"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MorseAudioEngine } from "@/lib/audio";
import { usePracticeEngine } from "@/hooks/usePracticeEngine";
import { AMOUNT_DEFAULT, amountUnit, type PracticeMode } from "@/lib/morse";
import ConfigBar from "@/components/ConfigBar";
import WordStream from "@/components/WordStream";
import LiveStatsBar from "@/components/LiveStatsBar";
import ResultsPanel from "@/components/ResultsPanel";
import { createClient } from "@/lib/supabase/client";

export default function PracticePage() {
  const audio = useMemo(() => new MorseAudioEngine(), []);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { state, wpm, accuracy, reset, inputSymbol, inputBackspace, inputConfirm } = usePracticeEngine(
    audio,
    soundEnabled
  );
  const [submitting, setSubmitting] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const submittedRef = useRef(false);
  const supabase = createClient();

  // Initial word list on mount
  useEffect(() => {
    reset("letters", AMOUNT_DEFAULT.char, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit result exactly once when a test finishes
  useEffect(() => {
    if (!state.finished || submittedRef.current || state.lettersDone === 0) return;
    submittedRef.current = true;
    setSubmitting(true);
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitting(false);
        return; // guests can still practice, just nothing gets saved
      }
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: state.mode,
          wpm,
          accuracy,
          isDaily: state.isDaily,
          wrongSymbolMap: state.wrongSymbolMap,
          bestStreakInTest: state.bestStreak,
          dailyWordCompletionTimes: state.wordCompletionTimes,
        }),
      });
      const json = await res.json();
      setNewAchievements(json.newlyUnlocked || []);
      setSubmitting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished]);

  // Keyboard handling
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        submittedRef.current = false;
        setNewAchievements([]);
        reset(state.mode, state.len, state.duration, state.isDaily);
        return;
      }
      if (![".", "-", " ", "Backspace"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Backspace") inputBackspace();
      else if (e.key === "." || e.key === "-") inputSymbol(e.key as "." | "-");
      else if (e.key === " ") inputConfirm();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state, reset, inputSymbol, inputBackspace, inputConfirm]);

  function handleConfigChange(mode: PracticeMode, len: number, duration: number) {
    submittedRef.current = false;
    setNewAchievements([]);
    reset(mode, len, duration);
  }

  const problemSymbols = Object.entries(state.wrongSymbolMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const rawWpm =
    state.startTime && state.finished
      ? Math.round(((state.lettersDone + state.symbolErrors) / 5) / (((Date.now() - state.startTime) / 60000) || 1))
      : 0;

  return (
    <div>
      <ConfigBar mode={state.mode} len={state.len} duration={state.duration} onChange={handleConfigChange} />

      <div className="flex items-center justify-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
          <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
          Sound
        </label>
      </div>

      <WordStream
        words={state.words}
        wordIdx={state.wordIdx}
        letterIdx={state.letterIdx}
        letterHadError={state.letterHadError}
        buffer={state.buffer}
      />

      <div className="text-center text-xs text-text-faint mt-4">
        Type <kbd className="bg-bg-elev-2 border border-border rounded px-1.5 font-display">.</kbd> and{" "}
        <kbd className="bg-bg-elev-2 border border-border rounded px-1.5 font-display">-</kbd> ·{" "}
        <kbd className="bg-bg-elev-2 border border-border rounded px-1.5 font-display">space</kbd> confirms a letter ·{" "}
        <kbd className="bg-bg-elev-2 border border-border rounded px-1.5 font-display">Esc</kbd> restarts
      </div>

      <LiveStatsBar
        wpm={wpm}
        accuracy={accuracy}
        streak={state.streak}
        mistakes={state.symbolErrors}
        progress={`${state.wordIdx}/${state.len}`}
        progressLabel={amountUnit(state.mode)}
        timeLeft={state.timeLeft}
      />

      {/* On-screen tap controls for touch devices */}
      <div className="flex gap-2.5 justify-center mt-5 sm:hidden">
        <button onClick={inputBackspace} className="w-13 h-16 rounded-xl bg-bg-elev border border-border text-text-dim">⌫</button>
        <button onClick={() => inputSymbol(".")} className="w-16 h-16 rounded-full bg-bg-elev border border-border text-lg">●</button>
        <button onClick={() => inputSymbol("-")} className="w-24 h-16 rounded-xl bg-bg-elev border border-border text-lg">▬</button>
        <button onClick={inputConfirm} className="w-13 h-16 rounded-xl bg-bg-elev border border-border text-text-dim">↵</button>
      </div>

      {state.finished && (
        <ResultsPanel
          wpm={wpm}
          rawWpm={rawWpm}
          accuracy={accuracy}
          mistakes={state.symbolErrors}
          bestStreak={state.bestStreak}
          problemSymbols={problemSymbols}
          newAchievements={newAchievements}
          onRetry={() => {
            submittedRef.current = false;
            setNewAchievements([]);
            reset(state.mode, state.len, state.duration, state.isDaily);
          }}
        />
      )}
      {submitting && <p className="text-center text-xs text-text-faint mt-3">Saving your result…</p>}
    </div>
  );
}
