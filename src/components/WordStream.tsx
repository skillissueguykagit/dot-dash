"use client";

import clsx from "clsx";
import { MORSE } from "@/lib/morse";

interface Props {
  words: string[];
  wordIdx: number;
  letterIdx: number;
  letterHadError: boolean;
  buffer: string;
}

export default function WordStream({ words, wordIdx, letterIdx, letterHadError, buffer }: Props) {
  const target = MORSE[(words[wordIdx] || "")[letterIdx]] || "";

  return (
    <div className="bg-bg-elev border border-border rounded-2xl px-10 py-11">
      <div className="font-display text-2xl leading-[2.1] tracking-wide">
        {words.map((w, wi) => (
          <span key={wi} className={clsx("inline-block mr-2.5 mb-1.5 px-1 rounded-md", wi === wordIdx && "bg-accent-glow")}>
            {w.split("").map((ch, li) => {
              const done = wi < wordIdx || (wi === wordIdx && li < letterIdx);
              const current = wi === wordIdx && li === letterIdx;
              return (
                <span
                  key={li}
                  className={clsx(
                    "px-px border-b-2 border-transparent",
                    done && "text-accent",
                    !done && !current && "text-text-faint",
                    current && "text-text border-accent",
                    current && letterHadError && "text-red border-red"
                  )}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        ))}
      </div>
      <div className="font-display text-xl tracking-[0.18em] text-center min-h-[34px] mt-6 text-text-dim">
        {buffer.split("").map((c, i) => (
          <span key={i} className={clsx(target[i] !== c && "text-red")}>
            {c}
          </span>
        ))}
        <span className="inline-block w-0.5 h-5 bg-accent ml-0.5 align-middle animate-pulse" />
      </div>
    </div>
  );
}
