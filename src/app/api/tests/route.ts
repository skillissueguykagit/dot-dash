import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS, type ProfileRow, type TestContext } from "@/lib/achievements";

interface Body {
  mode: string;
  wpm: number;
  accuracy: number; // 0-100
  isReverse?: boolean;
  isDaily?: boolean;
  wrongSymbolMap?: Record<string, number>;
  bestStreakInTest?: number;
  dailyWordCompletionTimes?: number[]; // ms elapsed at each word completion, for ghost replay
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextStreak(current: number, lastDate: string | null, today: string): number {
  if (!lastDate) return 1;
  if (lastDate === today) return current; // already counted today
  const diffDays = Math.round((Date.parse(today) - Date.parse(lastDate)) / 86400000);
  return diffDays === 1 ? current + 1 : 1;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body: Body = await req.json();
  const today = todayUTC();

  // NOTE: this is a straightforward read-modify-write, not wrapped in a DB
  // transaction. Fine for a single user submitting one test at a time (the
  // normal case); if you expect concurrent submissions from the same user
  // (e.g. multiple tabs), move this aggregate logic into a Postgres function
  // (supabase.rpc(...)) so it runs atomically.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updatedProfile: ProfileRow & { last_active_date: string | null; last_daily_date: string | null } = {
    tests_count: profile.tests_count + 1,
    best_wpm: Math.max(profile.best_wpm, body.wpm),
    acc_sum: Number(profile.acc_sum) + body.accuracy,
    streak: nextStreak(profile.streak, profile.last_active_date, today),
    last_active_date: today,
    daily_streak: profile.daily_streak,
    last_daily_date: profile.last_daily_date,
  };

  if (body.isDaily) {
    updatedProfile.daily_streak = nextStreak(profile.daily_streak, profile.last_daily_date, today);
    updatedProfile.last_daily_date = today;
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update(updatedProfile)
    .eq("id", user.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Test history row
  await supabase.from("test_history").insert({
    user_id: user.id,
    mode: body.mode,
    wpm: body.wpm,
    accuracy: body.accuracy,
    is_daily: !!body.isDaily,
  });

  // Cumulative per-symbol mistakes
  if (body.wrongSymbolMap) {
    for (const [symbol, count] of Object.entries(body.wrongSymbolMap)) {
      await supabase.rpc("increment_symbol_mistake", { p_user_id: user.id, p_symbol: symbol, p_count: count }).then(
        // Fallback if the increment_symbol_mistake() SQL function (see below)
        // hasn't been created yet: do a manual read-then-write instead.
        async (res) => {
          if (res.error) {
            const { data: existing } = await supabase
              .from("symbol_mistakes")
              .select("count")
              .eq("user_id", user.id)
              .eq("symbol", symbol)
              .maybeSingle();
            await supabase
              .from("symbol_mistakes")
              .upsert({ user_id: user.id, symbol, count: (existing?.count || 0) + count });
          }
        }
      );
    }
  }

  // Daily Challenge result + ghost timeline (only overwritten on a new best WPM)
  if (body.isDaily) {
    const { data: existingDaily } = await supabase
      .from("daily_results")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .maybeSingle();

    const isNewBest = !existingDaily || body.wpm > existingDaily.wpm;
    await supabase.from("daily_results").upsert({
      user_id: user.id,
      challenge_date: today,
      wpm: body.wpm,
      accuracy: body.accuracy,
      ghost_timeline: isNewBest
        ? body.dailyWordCompletionTimes || []
        : existingDaily?.ghost_timeline || [],
    });
  }

  // Achievements
  const { data: unlockedRows } = await supabase
    .from("achievements")
    .select("achievement_id")
    .eq("user_id", user.id);
  const unlockedIds = new Set((unlockedRows || []).map((r) => r.achievement_id));

  const ctx: TestContext = {
    wpm: body.wpm,
    acc: body.accuracy,
    bestStreakInTest: body.bestStreakInTest || 0,
    isReverse: !!body.isReverse,
    isDaily: !!body.isDaily,
    mode: body.mode,
  };

  const newlyUnlocked = ACHIEVEMENTS.filter(
    (a) => !unlockedIds.has(a.id) && a.check(updatedProfile, ctx)
  );

  if (newlyUnlocked.length) {
    await supabase
      .from("achievements")
      .insert(newlyUnlocked.map((a) => ({ user_id: user.id, achievement_id: a.id })));
  }

  return NextResponse.json({
    profile: updatedProfile,
    newlyUnlocked: newlyUnlocked.map((a) => ({ id: a.id, name: a.name, desc: a.desc, icon: a.icon })),
  });
}
