// Achievement definitions. `check` runs server-side (see app/api/tests/route.ts)
// against the just-updated profile row plus context about the test that was
// just completed. Mirrors the original client-side ACHIEVEMENTS array.

export interface ProfileRow {
  tests_count: number;
  best_wpm: number;
  acc_sum: number;
  streak: number;
  daily_streak: number;
}

export interface TestContext {
  wpm: number;
  acc: number;
  bestStreakInTest: number; // longest error-free letter streak within this one test
  isReverse: boolean;
  isDaily: boolean;
  mode: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (p: ProfileRow, ctx: TestContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_contact", name: "First Contact", desc: "Complete your first test", icon: "📡", check: (p) => p.tests_count >= 1 },
  { id: "wpm10", name: "10 WPM Operator", desc: "Reach 10 effective WPM", icon: "🎯", check: (p) => p.best_wpm >= 10 },
  { id: "wpm20", name: "20 WPM Operator", desc: "Reach 20 effective WPM", icon: "⚡", check: (p) => p.best_wpm >= 20 },
  { id: "wpm30", name: "30 WPM Operator", desc: "Reach 30 effective WPM", icon: "🔥", check: (p) => p.best_wpm >= 30 },
  { id: "wpm40", name: "40 WPM Operator", desc: "Reach 40 effective WPM", icon: "🚀", check: (p) => p.best_wpm >= 40 },
  { id: "tests10", name: "Getting the Hang of It", desc: "Complete 10 tests", icon: "🧭", check: (p) => p.tests_count >= 10 },
  { id: "tests50", name: "Seasoned Operator", desc: "Complete 50 tests", icon: "🛰️", check: (p) => p.tests_count >= 50 },
  { id: "tests100", name: "Century", desc: "Complete 100 tests", icon: "🏅", check: (p) => p.tests_count >= 100 },
  { id: "perfect_test", name: "Sharpshooter", desc: "Finish a test with 100% accuracy", icon: "🎖️", check: (_p, ctx) => ctx.acc === 100 },
  { id: "streak20", name: "On a Roll", desc: "Hit a 20-letter correct streak in one test", icon: "🔗", check: (_p, ctx) => ctx.bestStreakInTest >= 20 },
  { id: "avg_accuracy", name: "Precision Operator", desc: "Average 95%+ accuracy over 10+ tests", icon: "🧠", check: (p) => p.tests_count >= 10 && p.acc_sum / p.tests_count >= 95 },
  { id: "reverse_perfect", name: "Reverse Engineer", desc: "Decode a Reverse-mode test with 100% accuracy", icon: "🎧", check: (_p, ctx) => ctx.isReverse && ctx.acc === 100 },
  { id: "weak_mode_clean", name: "Weak Spot Slayer", desc: "Ace a Weak-Symbol drill with no mistakes", icon: "🛡️", check: (_p, ctx) => ctx.mode === "weak" && ctx.acc === 100 },
  { id: "day_streak3", name: "Three-Day Operator", desc: "Practice 3 days in a row", icon: "📅", check: (p) => p.streak >= 3 },
  { id: "day_streak7", name: "Week-Long Operator", desc: "Practice 7 days in a row", icon: "🗓️", check: (p) => p.streak >= 7 },
  { id: "daily_first", name: "On the Wire", desc: "Complete your first Daily Challenge", icon: "📻", check: (_p, ctx) => ctx.isDaily },
  { id: "daily_streak5", name: "Never Miss a Broadcast", desc: "5-day Daily Challenge streak", icon: "📡", check: (p) => p.daily_streak >= 5 },
];
