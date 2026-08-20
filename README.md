# Dot&Dash

A Monkeytype-style speed trainer for learning Morse code — type dots and dashes to encode text, or listen and decode by ear, with live WPM/accuracy tracking, achievements, and a daily challenge.

**🔗 Live demo (no setup, works instantly):** enable GitHub Pages for this repo (Settings → Pages → Source: `main` branch, `/docs` folder) and it'll be live at `https://YOUR-USERNAME.github.io/dotanddash/` — the file in `docs/index.html` is a fully self-contained prototype with zero dependencies.

**This repo contains two things:**
1. **`docs/index.html`** — the original single-file prototype. Open it directly in any browser, or host it free via GitHub Pages as above. Local-only stats (no account sync).
2. **Everything else** — a real Next.js + Supabase backend version with proper accounts, cross-device sync, and server-validated stats. See below for setup.

---

# Dot&Dash — Next.js + Supabase (backend version)


A real backend for the Dot&Dash Morse code trainer: accounts that sync across devices, a Postgres database via Supabase, and server-validated stats/achievements. This replaces the single-file prototype's `localStorage`-only persistence.

**Read `HANDOFF.md` (from the original project) first if you have it** — it documents every system this was ported from in detail (audio timing math, the practice state machine, ghost replay design, etc.).

## What's actually working here

- **Real auth** — Supabase Auth (email + password), proper sessions via cookies, no more `btoa()`-obfuscated passwords
- **Cross-device sync** — every stat lives in Postgres, not the browser
- **Practice mode** — Letters, Words, Sentences, Numbers, Mixed, with the same combined amount+time bounds, backspace-to-fix error handling, and shuffle-bag/procedural-sentence content generation as the original
- **Server-side stat aggregation** — `POST /api/tests` updates best WPM, accuracy average, day streak, cumulative per-symbol mistakes, and checks all 17 achievements, atomically enough for normal single-user use (see the note in that file about upgrading to a Postgres function if you need true concurrency safety)
- **Profile page** — real charts (Recharts) pulling from the database, weakest-symbols list, achievements grid, CSV export
- **Daily Challenge word generation** — moved server-side (`/api/daily`) so the "same content for everyone" guarantee is real, not just a client-side convention
- Full Morse engine, Farnsworth-timing-capable audio engine, and achievement definitions ported as pure, dependency-free TypeScript (`src/lib/morse.ts`, `src/lib/audio.ts`, `src/lib/achievements.ts`)

## What's stubbed / not yet wired into the UI

The **logic** for these mostly already exists in the ported libraries — they just don't have pages/components yet:

- **Reverse mode** (`playLetters` in `src/lib/audio.ts` already supports it fully, including Farnsworth and the per-symbol sync callback for a flashing lamp — needs a `/reverse` page)
- **Custom & Weak Symbols practice modes** (`makeModeGenerator` in `src/lib/morse.ts` already handles both — needs the character-picker panel and a fetch of `symbol_mistakes` from Supabase)
- **Daily Challenge UI + Ghost Replay** (`/api/daily` already returns deterministic words and any existing ghost timeline — needs the page, and the word-level ghost-marker rendering from the original)
- **Cheat sheet** (just needs a page rendering `MORSE` as a searchable grid — no new logic required)
- **Theme switcher UI** (the CSS variables for all 6 themes are already in `globals.css` — just needs the swatch buttons that set `data-theme` on `<html>`)
- **Global/daily leaderboards** (the `daily_results` table already has a public-read RLS policy for exactly this — needs a query + page)
- **Achievement toast notifications** (currently shown inline on the results panel after a test; the original had animated corner toasts)

None of this is hard — it's the same pattern as what's already built (call the lib function, render the result), just more pages to wire up.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is plenty to start).
2. **Run the schema**: open the SQL Editor in your Supabase dashboard and paste in the entire contents of `supabase/schema.sql`, then run it. This creates all tables, RLS policies, and the auto-profile-creation trigger.
3. **Copy environment variables**: `cp .env.example .env.local`, then fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's Settings → API page.
4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` — it redirects straight to `/practice`, same as the original.
5. **Email confirmation**: Supabase requires email confirmation by default. For local development, you can turn this off in your Supabase project under Authentication → Providers → Email → "Confirm email" toggle, so signup logs you straight in.

## Deploying

- **Vercel** (free tier) is the natural fit for the Next.js app — connect the repo, add the same two environment variables in Vercel's project settings, deploy.
- Supabase stays where it is; nothing else to configure.

## Project structure

```
src/
  app/
    practice/page.tsx       — main typing test (client component)
    profile/page.tsx        — stats, charts, achievements, CSV export
    login/, signup/         — Supabase Auth forms
    api/tests/route.ts      — records a completed test, updates all aggregates + achievements
    api/stats/route.ts      — fetches a user's full stats bundle
    api/daily/route.ts      — serves the deterministic Daily Challenge word list
  lib/
    morse.ts                — Morse data + content generation (shuffle-bag, seeded RNG, sentence grammar)
    audio.ts                — Web Audio engine with Farnsworth timing
    achievements.ts         — the 17 achievement definitions
    supabase/                — browser/server Supabase client factories
  hooks/
    usePracticeEngine.ts    — the practice test state machine, as a React reducer
  components/               — WordStream, ConfigBar, LiveStatsBar, ResultsPanel, TrendChart
supabase/
  schema.sql                — run this once in the Supabase SQL editor
```
