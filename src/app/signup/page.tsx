"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is required (default in Supabase), there's no
    // session yet — route to login with a note instead of straight to /practice.
    router.push("/login?confirm=1");
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-bg-elev border border-border rounded-2xl p-8">
      <h1 className="font-display text-xl font-bold mb-2">Create your account</h1>
      <p className="text-text-dim text-sm mb-6">
        Your WPM, accuracy, and history sync across every device you sign in on.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full bg-bg-elev-2 border border-border rounded-lg px-3 py-2.5 text-sm"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
          placeholder="Password (min 6 characters)"
          type="password"
          minLength={6}
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
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="text-xs text-text-faint mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
