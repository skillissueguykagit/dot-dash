-- Dot&Dash schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query) once,
-- on a fresh project. Auth (users/passwords/sessions) is handled entirely by
-- Supabase Auth (auth.users) — we never store or touch passwords ourselves.

-- ============ PROFILES ============
-- One row per user, created automatically when they sign up (see trigger below).
-- Mirrors the rolling-aggregate fields the client-side prototype kept in
-- localStorage: best_wpm, tests_count, streak, etc.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  tests_count int not null default 0,
  best_wpm int not null default 0,
  acc_sum numeric not null default 0,     -- sum of accuracy % across all tests, divide by tests_count for average
  streak int not null default 1,          -- general practice day-streak (any test counts)
  last_active_date date,
  daily_streak int not null default 0,    -- Daily Challenge specific streak
  last_daily_date date,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true); -- needed for public leaderboards later

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up. `username` is passed in
-- via the signup call's options.data.username (see src/app/signup/page.tsx).
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============ TEST HISTORY ============
-- One row per completed test (Practice or Reverse). Powers the WPM/accuracy
-- growth charts on the Profile page.
create table if not exists test_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null,             -- 'letters' | 'words' | 'sentences' | 'numbers' | 'mixed' | 'custom' | 'weak' | 'reverse'
  wpm int not null,
  accuracy int not null,          -- 0-100
  is_daily boolean not null default false,
  created_at timestamptz not null default now()
);

alter table test_history enable row level security;

create policy "Users can view their own test history"
  on test_history for select using (auth.uid() = user_id);

create policy "Users can insert their own test history"
  on test_history for insert with check (auth.uid() = user_id);

create index if not exists test_history_user_id_idx on test_history(user_id, created_at);

-- ============ SYMBOL MISTAKES ============
-- Cumulative per-symbol mistake counts, across every test ever taken.
-- This is what powers the Weak Symbols drill mode and the Profile page's
-- "weakest symbols" list — it's intentionally cumulative, not per-test.
create table if not exists symbol_mistakes (
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  count int not null default 0,
  primary key (user_id, symbol)
);

alter table symbol_mistakes enable row level security;

create policy "Users can view their own mistakes"
  on symbol_mistakes for select using (auth.uid() = user_id);

create policy "Users can upsert their own mistakes"
  on symbol_mistakes for insert with check (auth.uid() = user_id);

create policy "Users can update their own mistakes"
  on symbol_mistakes for update using (auth.uid() = user_id);

-- Atomic upsert-increment, used by app/api/tests/route.ts so concurrent
-- requests can't clobber each other's counts (unlike a plain read-then-write).
create or replace function increment_symbol_mistake(p_user_id uuid, p_symbol text, p_count int)
returns void as $$
begin
  insert into symbol_mistakes (user_id, symbol, count)
  values (p_user_id, p_symbol, p_count)
  on conflict (user_id, symbol)
  do update set count = symbol_mistakes.count + excluded.count;
end;
$$ language plpgsql security definer;

-- ============ DAILY CHALLENGE RESULTS ============
-- One row per user per day. ghost_timeline stores the best run's word-completion
-- checkpoints (ms elapsed at each word) for the Ghost Replay feature — only
-- overwritten when a new run beats the previous best WPM (see API route).
create table if not exists daily_results (
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_date date not null,
  wpm int not null,
  accuracy int not null,
  ghost_timeline jsonb not null default '[]',
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_date)
);

alter table daily_results enable row level security;

create policy "Users can view their own daily results"
  on daily_results for select using (auth.uid() = user_id);

create policy "Users can upsert their own daily results"
  on daily_results for insert with check (auth.uid() = user_id);

create policy "Users can update their own daily results"
  on daily_results for update using (auth.uid() = user_id);

-- Optional, for a future global daily leaderboard: everyone's score, same
-- content, same day — safe to expose publicly since it's just a number.
create policy "Anyone can view daily leaderboard scores"
  on daily_results for select using (true);

-- ============ ACHIEVEMENTS ============
-- Achievement *definitions* live in code (src/lib/achievements.ts), matching
-- the original client-side ACHIEVEMENTS array. This table just records which
-- ids a user has unlocked and when.
create table if not exists achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table achievements enable row level security;

create policy "Users can view their own achievements"
  on achievements for select using (auth.uid() = user_id);

create policy "Users can insert their own achievements"
  on achievements for insert with check (auth.uid() = user_id);
