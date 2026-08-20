"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { MORSE, type PracticeMode, makeModeGenerator, AMOUNT_DEFAULT } from "@/lib/morse";
import { MorseAudioEngine } from "@/lib/audio";

interface State {
  mode: PracticeMode;
  len: number;
  duration: number;
  timeLeft: number;
  words: string[];
  wordIdx: number;
  letterIdx: number;
  buffer: string;
  started: boolean;
  finished: boolean;
  startTime: number | null;
  symbolAttempts: number;
  symbolErrors: number;
  lettersDone: number;
  letterHadError: boolean;
  streak: number;
  bestStreak: number;
  wrongSymbolMap: Record<string, number>;
  isDaily: boolean;
  wordCompletionTimes: number[];
}

type Action =
  | { type: "SET_WORDS"; words: string[] }
  | { type: "BEGIN"; now: number }
  | { type: "SYMBOL"; sym: "." | "-" }
  | { type: "BACKSPACE" }
  | { type: "CONFIRM"; now: number }
  | { type: "TICK"; timeLeft: number }
  | { type: "FINISH" }
  | { type: "RESET"; mode: PracticeMode; len: number; duration: number; isDaily?: boolean };

function currentTarget(s: State): string {
  const w = s.words[s.wordIdx] || "";
  return MORSE[w[s.letterIdx]] || "";
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "SET_WORDS":
      return { ...s, words: a.words };
    case "BEGIN":
      return s.started ? s : { ...s, started: true, startTime: a.now };
    case "SYMBOL": {
      const target = currentTarget(s);
      const buffer = s.buffer + a.sym;
      const idx = buffer.length - 1;
      const wrong = target[idx] !== a.sym;
      const w = s.words[s.wordIdx] || "";
      const wrongCh = w[s.letterIdx];
      return {
        ...s,
        buffer,
        symbolAttempts: s.symbolAttempts + 1,
        symbolErrors: s.symbolErrors + (wrong ? 1 : 0),
        letterHadError: s.letterHadError || wrong,
        wrongSymbolMap: wrong
          ? { ...s.wrongSymbolMap, [wrongCh]: (s.wrongSymbolMap[wrongCh] || 0) + 1 }
          : s.wrongSymbolMap,
      };
    }
    case "BACKSPACE": {
      const buffer = s.buffer.slice(0, -1);
      const target = currentTarget(s);
      const letterHadError = buffer.split("").some((c, i) => target[i] !== c);
      return { ...s, buffer, letterHadError };
    }
    case "CONFIRM": {
      const target = currentTarget(s);
      if (s.buffer !== target) return s; // blocked — must fix the error first
      const w = s.words[s.wordIdx] || "";
      const lettersDone = s.lettersDone + 1;
      const streak = s.letterHadError ? 0 : s.streak + 1;
      const bestStreak = Math.max(s.bestStreak, streak);
      let letterIdx = s.letterIdx + 1;
      let wordIdx = s.wordIdx;
      let wordCompletionTimes = s.wordCompletionTimes;
      let finished = s.finished;
      if (letterIdx >= w.length) {
        letterIdx = 0;
        wordIdx += 1;
        wordCompletionTimes = [...wordCompletionTimes, a.now - (s.startTime ?? a.now)];
        if (wordIdx >= s.words.length) finished = true;
      }
      return {
        ...s,
        buffer: "",
        letterHadError: false,
        lettersDone,
        streak,
        bestStreak,
        letterIdx,
        wordIdx,
        wordCompletionTimes,
        finished,
      };
    }
    case "TICK":
      return { ...s, timeLeft: a.timeLeft, finished: a.timeLeft <= 0 ? true : s.finished };
    case "FINISH":
      return { ...s, finished: true };
    case "RESET":
      return {
        ...initialState,
        mode: a.mode,
        len: a.len,
        duration: a.duration,
        timeLeft: a.duration,
        isDaily: a.isDaily ?? false,
      };
    default:
      return s;
  }
}

const initialState: State = {
  mode: "letters",
  len: AMOUNT_DEFAULT.char,
  duration: 15,
  timeLeft: 15,
  words: [],
  wordIdx: 0,
  letterIdx: 0,
  buffer: "",
  started: false,
  finished: false,
  startTime: null,
  symbolAttempts: 0,
  symbolErrors: 0,
  lettersDone: 0,
  letterHadError: false,
  streak: 0,
  bestStreak: 0,
  wrongSymbolMap: {},
  isDaily: false,
  wordCompletionTimes: [],
};

export interface PracticeGenOptions {
  customChars?: string[];
  weakSymbols?: { symbol: string; count: number }[];
  dailyWords?: string[]; // fetched from /api/daily, deterministic per day
}

export function usePracticeEngine(audio: MorseAudioEngine, soundEnabled: boolean) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optsRef = useRef<PracticeGenOptions>({});

  const buildWords = useCallback((mode: PracticeMode, len: number, isDaily: boolean) => {
    if (isDaily && optsRef.current.dailyWords) {
      dispatch({ type: "SET_WORDS", words: optsRef.current.dailyWords });
      return;
    }
    const gen = makeModeGenerator(mode, optsRef.current);
    const list = Array.from({ length: len }, () => gen());
    dispatch({ type: "SET_WORDS", words: list });
  }, []);

  const reset = useCallback(
    (mode: PracticeMode, len: number, duration: number, isDaily = false, opts: PracticeGenOptions = {}) => {
      optsRef.current = opts;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      dispatch({ type: "RESET", mode, len, duration, isDaily });
      buildWords(mode, len, isDaily);
    },
    [buildWords]
  );

  // Timer effect — runs whenever the test is active.
  useEffect(() => {
    if (!state.started || state.finished) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (!state.startTime) return;
      const elapsed = (Date.now() - state.startTime) / 1000;
      const timeLeft = Math.max(0, Math.round(state.duration - elapsed));
      dispatch({ type: "TICK", timeLeft });
    }, 250);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.started, state.finished, state.startTime, state.duration]);

  const inputSymbol = useCallback(
    (sym: "." | "-") => {
      if (state.finished) return;
      if (!state.started) dispatch({ type: "BEGIN", now: Date.now() });
      const target = currentTarget(state);
      const wrong = target[state.buffer.length] !== sym;
      dispatch({ type: "SYMBOL", sym });
      if (soundEnabled) {
        if (wrong) audio.playErrorSound();
        else audio.playKeySound(sym);
      }
    },
    [state, audio, soundEnabled]
  );

  const inputBackspace = useCallback(() => {
    if (state.finished) return;
    if (!state.started) dispatch({ type: "BEGIN", now: Date.now() });
    dispatch({ type: "BACKSPACE" });
  }, [state]);

  const inputConfirm = useCallback(() => {
    if (state.finished) return;
    if (!state.started) dispatch({ type: "BEGIN", now: Date.now() });
    const target = currentTarget(state);
    if (state.buffer !== target) {
      if (soundEnabled) audio.playErrorSound();
      return;
    }
    if (soundEnabled) audio.playConfirmSound();
    dispatch({ type: "CONFIRM", now: Date.now() });
  }, [state, audio, soundEnabled]);

  // Fire the completion chime exactly once when a test transitions to finished.
  const prevFinished = useRef(false);
  useEffect(() => {
    if (state.finished && !prevFinished.current && soundEnabled) {
      audio.playCompleteChime();
    }
    prevFinished.current = state.finished;
  }, [state.finished, audio, soundEnabled]);

  const elapsedMinutes = state.startTime ? (Date.now() - state.startTime) / 60000 : 0;
  const wpm = elapsedMinutes > 0 ? Math.round(state.lettersDone / 5 / elapsedMinutes) : 0;
  const accuracy =
    state.symbolAttempts > 0
      ? Math.round((100 * (state.symbolAttempts - state.symbolErrors)) / state.symbolAttempts)
      : 100;

  return {
    state,
    wpm,
    accuracy,
    reset,
    buildWords,
    inputSymbol,
    inputBackspace,
    inputConfirm,
  };
}
