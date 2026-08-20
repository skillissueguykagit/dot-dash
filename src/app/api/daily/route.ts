import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDailyWords, getDailySeedString } from "@/lib/morse";

// Generated server-side (not trusted from the client) so the "same content
// for everyone" guarantee actually holds and can't be spoofed. The seed is
// purely date-based, so this needs no database row of its own — any server
// computes the same list for the same UTC date.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = getDailySeedString();
  const words = buildDailyWords();

  let result = null;
  if (user) {
    const { data } = await supabase
      .from("daily_results")
      .select("wpm, accuracy, ghost_timeline")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .maybeSingle();
    result = data;
  }

  return NextResponse.json({ date: today, words, result });
}
