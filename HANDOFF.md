# Dot&Dash — Handoff Notes

Single-file prototype (`dotanddash.html`, ~1,490 lines: inline `<style>` + inline `<script>`, no build step, no dependencies except two Google Fonts). Everything below exists today and works; this doc exists so a rebuild in a real stack doesn't have to reverse-engineer it from the HTML.

## What it is
A Monkeytype-style speed trainer, but for Morse code. Users type dots/dashes to encode text (Practice mode) or listen to Morse and type the decoded word (Reverse mode). Accounts, stats, achievements, and a daily challenge are all currently simulated client-side with `localStorage`.

## The one thing that has to change
**There is no server.** "Accounts" are a `username → {passwordHash, stats}` map inside a single `localStorage` key (`dd_users`). Passwords are `btoa()`-obfuscated, not hashed. This is fine for a demo, not for real users. Everything else below can mostly be ported as-is; auth/storage is the one piece that must be rebuilt properly (real hashing, a real DB, sessions/JWT).

---

## Core systems

### 1. Morse engine
- `MORSE` — the full letter/number/punctuation → dot-dash map (one object, ~40 entries).
- `WORDS` (~190 common words), `SENT_SUBJECTS` / `SENT_VERBS` / `SENT_OBJECTS` / `SENT_PHRASES` (grammar-template vocab for procedural sentence generation — see below), `NUM_WORDS`, `NUM_POOL_SINGLE`, `PUNCT_POOL`, `LETTER_POOL`.
- **Shuffle-bag content generation** (`shuffle`, `makeBag`): draws every item from a pool before repeating any, and swaps at the reshuffle seam so the same item never lands twice in a row. Used for all non-deterministic content (Letters/Words/Numbers/Mixed/Custom/Weak modes).
- **Sentence generation is procedural, not a fixed list**: `makeModeGenerator('sentences')` picks subject + verb + object + optional phrase from the vocab arrays above via separate bags, so sentences read naturally ("THE ENGINEER CONFIRMED THE COORDINATES BEFORE SUNRISE") and rarely repeat.
- **Deterministic (seeded) generation for the Daily Challenge**: `hashStringToSeed`, `mulberry32` (seeded PRNG), `seededShuffle`, `makeSeededBag`. Seed = hash of `"dotanddash-daily-" + UTC date string`, so every visitor gets the identical 10-word list on a given day with no server coordination needed. **A real backend should almost certainly move this server-side** (generate once, serve to all clients) rather than trusting every client to compute the same thing — the current approach is a clever client-only hack, not the "right" way once you have a server.

### 2. Audio engine (Web Audio API)
- `ctx()` — lazy-inits a single `AudioContext`.
- `playTone(startTime, duration, freq, vol)` — schedules one oscillator; tracked in `activeOscillators` so it can be force-stopped later.
- `playMorseLetters(letters, charWpm, effWpm, onSymbol, onDone)` — the real player. Takes an array of per-letter dot/dash strings (not a flat string), and **two speeds**: `charWpm` (how crisp each dot/dash sounds) and `effWpm` (how much space between letters/words). When equal, it's normal evenly-timed Morse. When `charWpm > effWpm`, that's **Farnsworth timing** — full-speed character sounds with elongated gaps, the standard method for training recognition at speed while keeping thinking time. `onSymbol(letterIdx, symbolIdx, startTime, duration)` fires per dot/dash so callers can sync a visual to the exact audio timing.
- `playMorseString(str, wpm, onDone)` — thin wrapper around the above for simple single-speed playback (used by the cheat sheet).
- `stopAllAudio()` — **important**: Web Audio schedules tones ahead of time as a batch, so without this, switching views mid-playback leaves audio running in the background. This stops all scheduled oscillators, clears all pending `setTimeout`s used for visual sync (`activeTimeouts`, via `trackedTimeout`), and resets any lamp/highlight DOM state. Called at the top of every `goTo()` navigation and at the start of every new `playMorseLetters()` call.
- Separate short one-off tones for typing feedback: `playKeySound`, `playErrorSound`, `playConfirmSound`, `playCompleteChime`, `playAchievementSound`. Global `soundEnabled` toggle.

### 3. Practice mode state machine
Single mutable object `practiceState` drives everything. Key fields: `mode` (letters/words/sentences/numbers/mixed/custom/weak), `len` (target word/character count), `duration` (seconds), `timeLeft`, `words` (the generated array for this run), `wordIdx`/`letterIdx`/`buffer` (cursor position + in-progress dot/dash entry), `started`/`finished`, `isDaily`, `wordCompletionTimes` (elapsed-ms checkpoints, used for ghost replay), `pausedAt`.

**Both an amount (words/characters) and a duration are always active as combined bounds** — a test ends on whichever is hit first. There's no separate "by word count" vs "by time" mode; that was an earlier design that got explicitly removed per user feedback. Amount options adapt to mode: character-token modes (`letters`, `custom`, `weak`) offer 25/50/100 (default 50); word-token modes (`words`, `sentences`, `numbers`, `mixed`) offer 10/25/50 (default 10). Duration is always 15/30/60/120s (default 15).

**Input handling is refactored into three shared functions** — `inputSymbol(sym)`, `inputBackspace()`, `inputConfirm()` — called both by the keyboard handler (`handlePracticeKey`, bound to `keydown`) and by on-screen tap buttons (`#mobileDot`/`#mobileDash`/`#mobileBackspace`/`#mobileConfirm`, shown under 720px viewport width) so behavior is identical either way. **Wrong symbols block progress**: a mismatched dot/dash turns the current letter red and `inputConfirm()` refuses to advance until backspace fixes it — this was a deliberate design choice (see conversation history), not a bug.

**Timer pauses on navigation.** `goTo()` detects leaving Practice mid-test and clears the interval + records `pausedAt`; returning shifts `startTime` forward by the paused duration before resuming. Without this, a timed test kept running via wall-clock math even while the user was on another tab, which could silently finish the test in the background — this was a bug that got fixed, worth preserving the behavior in a rewrite.

WPM is computed live every 250ms via a ticking `setInterval` (`startTimerIfNeeded`), not just on keystrokes, so the number updates even between key presses. Formula: `(lettersDone / 5) / elapsedMinutes`. Accuracy: `(symbolAttempts - symbolErrors) / symbolAttempts`.

### 4. Reverse mode
`reverseState` (much simpler: `words`, `idx`, `correct`, `total`, `len`). Word list built from the same `WORDS` pool via a bag. Each word's Morse is rendered as individual `<span class="rev-sym" data-li data-si>` elements (not just text) so `playCurrentReverseWord()` can highlight the exact symbol being played in sync with the audio via the `onSymbol` callback, plus a separate flashing "lamp" element (`#revLamp`). Farnsworth toggle shows/hides a second speed slider (`charWpmSlider`); a safety clamp prevents character speed from being set slower than effective speed (which would invert the whole point).

### 5. Daily Challenge + Ghost Replay
- `getDailySeedString()` → UTC date string, `buildDailyWords()` → 10 deterministic words from the seeded bag.
- `startDailyChallenge()` forces `practiceState` into a fixed config (words mode, 10 words, 30s, `isDaily:true`) and reuses the entire normal practice flow.
- On finish, `recordDailyResult(wpm, acc)` saves to `stats.dailyResults[date]`, **but only overwrites the stored `ghostTimeline` if the new run beats the previous best WPM** — so the ghost always represents your personal best, not your latest attempt.
- Ghost data is **word-level, not letter-level**: `practiceState.wordCompletionTimes` records elapsed-ms every time a word completes. `ghostState.timeline` holds the best run's array; `advanceGhost(elapsedMs)` walks it every timer tick (and on every word completion) to find which word the ghost is "on," rendered as a dashed-outline marker (`.ghost-word`) distinct from the player's own highlighted current word. A `live-ghost` stat shows `+N`/`-N`/`Even`.
- Separate daily-specific streak (`dailyStreak`/`lastDailyDate`, via `updateDailyStreak`) distinct from the general practice-day streak (`streak`/`lastActiveDate`, via `updateDayStreak`) — completing *any* test extends the general streak; only completing the *daily challenge specifically* extends the daily streak.

### 6. Stats, achievements, storage
- `defaultStats()` shape: `{tests, bestWpm, accSum, accCount, streak, history[], symbolMistakes{}, achievements[], lastActiveDate, dailyResults{}, dailyStreak, lastDailyDate}`. `history` is capped at the last 50 entries (`{date, wpm, acc}`), used to draw the growth charts.
- `recordTestResult(wpm, acc, mistakes, extra)` is the single write path for every completed test (Practice or Reverse). It merges per-symbol mistakes into a running `symbolMistakes` tally (this is what powers the "Weak Symbols" drill mode and the Profile page's weakest-symbols list — it's cumulative across all sessions, not just the last test), updates the day streak, and checks achievements.
- `ACHIEVEMENTS` — array of `{id, name, desc, icon, check(stats, ctx)}`. 17 total: WPM milestones, test-count milestones, perfect-accuracy test, 20-letter streak, 95%+ average accuracy over 10+ tests, perfect Reverse run, perfect Weak-Symbol drill, 3/7-day streaks, first daily challenge, 5-day daily streak. `checkAchievements` diffs against `stats.achievements` (array of unlocked ids) and returns newly-unlocked ones; `showAchievementToast` renders + plays a sound for each.
- **Weak Symbols mode** (`makeModeGenerator('weak')`) reads `stats.symbolMistakes`, takes the top 10 offenders, and builds a *weighted* pool (more-missed symbols appear up to 5x as often) — this is real personalization driven by accumulated data, worth preserving exactly.
- `buildSparkline(values, colorVar)` — hand-rolled inline SVG line chart (no charting library), reused for WPM growth, accuracy trend, and daily-score history. Would probably become a Recharts component in a real rebuild.
- **`Store` wrapper** (`/* STORAGE */` section): tries `localStorage`, catches failures, falls back to an in-memory object. This exists specifically because Claude.ai's artifact preview sandbox blocks `localStorage` — **not relevant once this has a real backend**, but the fallback pattern (graceful degradation, never throw) is worth keeping for offline resilience.
- `exportStatsCSV()` — client-side CSV generation via `Blob` + a synthetic `<a download>` click. Trivial to replace with a real export endpoint.

### 7. UI structure
Single-page, view-based (not routed): `#view-practice`, `#view-reverse`, `#view-cheatsheet`, `#view-profile`, `#view-daily`, toggled via `.active` class by `goTo(name)`. `views` array + `nav [data-nav]` buttons drive it. No history/URL state — refreshing always lands on Practice. **This should become real routes in a rewrite** (Next.js app router, one route per view) rather than staying a client-side view-switcher.

Six CSS custom-property themes (`dark`/`ocean`/`forest`/`sunset`/`light`/`mono`) via `[data-theme]` attribute overrides on `:root` variables — ports directly to any CSS-in-JS or Tailwind config.

---

## What's genuinely backend-dependent (the reason we're here)
1. **Real accounts** — proper password hashing (bcrypt/argon2), sessions or JWT, not `btoa()`.
2. **Cross-device sync** — stats currently die with the browser's `localStorage`. Needs a real DB (Postgres/Supabase fits the data model above almost 1:1 — `users`, `test_history`, `daily_results`, `achievements` tables).
3. **Global leaderboards** — literally impossible client-side; needs a shared DB to compare across users.
4. **Multiplayer race** — needs websockets/a real-time layer to coordinate two people typing the same content simultaneously. Nothing here today attempts this.
5. **Daily Challenge integrity** — the seeded-client-generation trick works for "same content for everyone" but can't validate that a submitted score is legitimate. Server-side generation + server-side score validation needed for anything competitive.

## What ports over almost unchanged
Morse engine and data tables, audio engine (Farnsworth math, oscillator scheduling, sync-callback pattern), the entire practice state machine and input-validation logic, sentence-generation grammar, weighted weak-symbol drilling, achievement definitions, sparkline chart rendering, theme system, mobile tap-control fallback.
