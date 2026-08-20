// Web Audio Morse playback engine, with Farnsworth timing support.
// Ported from the original prototype's playMorseLetters/stopAllAudio — see
// HANDOFF.md for the rationale behind the two-speed (charWpm/effWpm) design.
//
// This is a class (rather than the original's module-level globals) so each
// component instance gets its own isolated audio state — safer under React's
// StrictMode double-invoke and if multiple players ever exist on a page.

export type SymbolCallback = (
  letterIndex: number,
  symbolIndex: number,
  startTime: number,
  duration: number
) => void;

export class MorseAudioEngine {
  private ctx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];
  public onStop: (() => void) | null = null; // hook for UI cleanup (lamp off, highlights cleared)

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  private trackedTimeout(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter((x) => x !== id);
      fn();
    }, ms);
    this.activeTimeouts.push(id);
    return id;
  }

  private playTone(startTime: number, duration: number, freq = 600, vol = 0.18) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    gain.gain.setValueAtTime(vol, startTime + duration - 0.005);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    this.activeOscillators.push(osc);
    osc.addEventListener("ended", () => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    });
  }

  /** Hard-stops everything in flight. Call on unmount / navigation / before replaying. */
  stopAll() {
    this.activeOscillators.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    this.activeOscillators = [];
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts = [];
    this.onStop?.();
  }

  /**
   * Plays an array of letters (each a dot/dash string, e.g. ["....", ".", ".-..", ...]).
   * charWpm controls dot/dash duration + intra-character spacing (crisp, full speed).
   * effWpm controls inter-character/word spacing. Equal = normal Morse.
   * charWpm > effWpm = Farnsworth timing (full-speed sounds, generous gaps).
   * onSymbol fires per dot/dash so callers can sync a visual to the exact audio timing.
   */
  playLetters(
    letters: string[],
    charWpm: number,
    effWpm: number,
    onSymbol?: SymbolCallback,
    onDone?: () => void
  ) {
    this.stopAll();
    const ctx = this.getCtx();
    const uc = 1.2 / charWpm;
    const uw = 1.2 / effWpm;
    let t = ctx.currentTime + 0.15;

    letters.forEach((letter, li) => {
      const symbols = letter.split("");
      symbols.forEach((sym, si) => {
        const dur = sym === "." ? uc : uc * 3;
        this.playTone(t, dur);
        onSymbol?.(li, si, t, dur);
        t += dur;
        if (si < symbols.length - 1) t += uc;
      });
      if (li < letters.length - 1) t += uw * 3;
    });

    if (onDone) this.trackedTimeout(onDone, Math.max(0, t - ctx.currentTime) * 1000);
  }

  /** Simple single-speed playback (e.g. for the cheat sheet). */
  playString(str: string, wpm: number, onDone?: () => void) {
    const letters = str.trim().split(" ").filter(Boolean);
    this.playLetters(letters, wpm, wpm, undefined, onDone);
  }

  /** Convert an audio-context-relative start time into a wall-clock delay from now (ms). */
  msUntil(audioTime: number): number {
    return Math.max(0, (audioTime - this.getCtx().currentTime) * 1000);
  }

  scheduleAt(audioTime: number, fn: () => void) {
    this.trackedTimeout(fn, this.msUntil(audioTime));
  }

  // ---------- Short one-off feedback tones (typing sounds) ----------
  playKeySound(sym: "." | "-") {
    const ctx = this.getCtx();
    this.playTone(ctx.currentTime, sym === "." ? 0.055 : 0.13, 620, 0.11);
  }
  playErrorSound() {
    const ctx = this.getCtx();
    this.playTone(ctx.currentTime, 0.09, 190, 0.13);
  }
  playConfirmSound() {
    const ctx = this.getCtx();
    this.playTone(ctx.currentTime, 0.045, 920, 0.08);
  }
  playCompleteChime() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.playTone(t, 0.09, 660, 0.12);
    this.playTone(t + 0.09, 0.09, 880, 0.12);
    this.playTone(t + 0.18, 0.16, 1100, 0.12);
  }
  playAchievementSound() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    this.playTone(t, 0.08, 780, 0.12);
    this.playTone(t + 0.09, 0.08, 980, 0.12);
    this.playTone(t + 0.18, 0.2, 1300, 0.13);
  }
}
