"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const justSignedUp = params.get("confirm") === "1";
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/practice");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-bg-elev border border-border rounded-2xl p-8">
      <h1 className="font-display text-xl font-bold mb-2">Sign in</h1>
      {justSignedUp && (
        <p className="text-accent text-xs mb-4 bg-accent-glow rounded-lg px-3 py-2">
          Account created — check your email to confirm it, then sign in below.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full bg-bg-elev-2 border border-border rounded-lg px-3 py-2.5 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full bg-bg-elev-2 border border-border rounded-lg px-3 py-2.5 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-xs text-text-faint mt-4">
        No account yet?{" "}
        <Link href="/signup" className="text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}
