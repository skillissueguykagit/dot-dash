"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import TrendChart from "@/components/TrendChart";

interface StatsBundle {
  profile: {
    tests_count: number;
    best_wpm: number;
    acc_sum: number;
    streak: number;
    daily_streak: number;
  } | null;
  history: { wpm: number; accuracy: number; created_at: string }[];
  mistakes: { symbol: string; count: number }[];
  achievements: { achievement_id: string }[];
}

export default function ProfilePage() {
  const [data, setData] = useState<StatsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (r.status === 401) {
          setSignedIn(false);
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      });
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = [["date", "wpm", "accuracy"], ...data.history.map((h) => [h.created_at, h.wpm, h.accuracy])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dotanddash-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!signedIn) {
    return (
      <div className="text-center mt-20 text-text-dim">
        <p>Sign in to see your stats.</p>
      </div>
    );
  }
  if (loading || !data?.profile) return <p className="text-center mt-20 text-text-faint">Loading…</p>;

  const { profile, history, mistakes, achievements } = data;
  const avgAcc = profile.tests_count ? Math.round(profile.acc_sum / profile.tests_count) : 0;
  const unlockedIds = new Set(achievements.map((a) => a.achievement_id));

  return (
    <div>
      <div className="flex items-center justify-between mt-6 mb-5 flex-wrap gap-3">
        <h1 className="font-display text-xl font-extrabold">Your Stats</h1>
        <button onClick={exportCsv} className="border border-border rounded-lg px-4 py-2 text-xs font-semibold text-text-dim hover:border-accent hover:text-accent">
          Export CSV ↓
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { v: profile.tests_count, l: "Tests Run" },
          { v: profile.best_wpm, l: "Best WPM" },
          { v: `${avgAcc}%`, l: "Avg Accuracy" },
          { v: profile.streak, l: "Day Streak" },
        ].map((c) => (
          <div key={c.l} className="bg-bg-elev-2 border border-border rounded-xl p-4">
            <div className="font-display text-xl font-extrabold">{c.v}</div>
            <div className="text-[11px] text-text-faint uppercase tracking-wider mt-0.5">{c.l}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-elev border border-border rounded-2xl p-6 mb-5">
        <h2 className="text-[13px] text-accent uppercase tracking-widest font-display mb-3">WPM Growth</h2>
        <TrendChart data={history} dataKey="wpm" color="var(--accent)" />
      </div>

      <div className="bg-bg-elev border border-border rounded-2xl p-6 mb-5">
        <h2 className="text-[13px] text-accent uppercase tracking-widest font-display mb-3">Accuracy Trend</h2>
        <TrendChart data={history} dataKey="accuracy" color="var(--amber)" />
      </div>

      <div className="bg-bg-elev border border-border rounded-2xl p-6 mb-5">
        <h2 className="text-[13px] text-accent uppercase tracking-widest font-display mb-3">Weakest Symbols</h2>
        <div className="flex flex-wrap gap-2">
          {mistakes.length ? (
            mistakes.map((m) => (
              <div key={m.symbol} className="bg-bg-elev-2 border border-border rounded-lg px-2.5 py-1.5 font-display text-xs flex gap-1.5 items-center">
                {m.symbol} <span className="text-red font-bold">×{m.count}</span>
              </div>
            ))
          ) : (
            <p className="text-text-faint text-xs">No mistakes logged yet — practice to start building your profile.</p>
          )}
        </div>
      </div>

      <div className="bg-bg-elev border border-border rounded-2xl p-6">
        <h2 className="text-[13px] text-accent uppercase tracking-widest font-display mb-3">
          Achievements <span className="text-text-dim normal-case tracking-normal font-semibold">({unlockedIds.size}/{ACHIEVEMENTS.length})</span>
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div
                key={a.id}
                title={a.desc}
                className={`bg-bg-elev-2 border border-border rounded-xl p-3.5 text-center ${unlocked ? "border-accent" : "opacity-40 grayscale"}`}
              >
                <div className="text-2xl">{unlocked ? a.icon : "🔒"}</div>
                <div className="text-[11.5px] font-bold mt-1.5">{a.name}</div>
                <div className="text-[10px] text-text-faint mt-1 leading-tight">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
