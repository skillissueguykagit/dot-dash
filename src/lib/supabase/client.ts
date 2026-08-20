import { createBrowserClient } from "@supabase/ssr";

// Use this inside Client Components ("use client" files) — e.g. the practice
// page, which needs to read the logged-in user and call Supabase directly
// from the browser for fast, low-latency reads.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
