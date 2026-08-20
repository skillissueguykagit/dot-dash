import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Dot&Dash — Learn Morse Code by Speed",
  description: "A Monkeytype-style speed trainer for Morse code.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="max-w-[920px] mx-auto px-6 pb-20">
          <div className="flex items-center justify-between py-5 border-b border-border mb-2 flex-wrap gap-3">
            <Link href="/practice" className="font-display font-bold text-lg flex items-center gap-2">
              <span className="w-4 h-1.5 bg-accent rounded-sm inline-block" />
              Dot&amp;Dash
            </Link>
            <nav className="flex items-center gap-1 flex-wrap">
              <Link href="/practice" className="px-3 py-2 rounded-lg text-sm font-semibold text-text-dim hover:bg-bg-elev-2">Practice</Link>
              <Link href="/profile" className="px-3 py-2 rounded-lg text-sm font-semibold text-text-dim hover:bg-bg-elev-2">Profile</Link>
              {user ? (
                <SignOutButton />
              ) : (
                <>
                  <Link href="/login" className="px-3 py-2 rounded-lg text-sm font-semibold text-text-dim hover:bg-bg-elev-2">Sign in</Link>
                  <Link href="/signup" className="px-3 py-2 rounded-lg text-sm font-bold bg-accent text-bg">Sign up</Link>
                </>
              )}
            </nav>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
