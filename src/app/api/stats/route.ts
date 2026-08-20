import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [{ data: profile }, { data: history }, { data: mistakes }, { data: achievements }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("test_history")
        .select("wpm, accuracy, created_at, mode")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50),
      supabase
        .from("symbol_mistakes")
        .select("symbol, count")
        .eq("user_id", user.id)
        .order("count", { ascending: false })
        .limit(10),
      supabase.from("achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
    ]);

  return NextResponse.json({ profile, history: history || [], mistakes: mistakes || [], achievements: achievements || [] });
}
