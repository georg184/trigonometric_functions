# Supabase Variants For Login And Highscores

This note records the planned options for adding registration, login, and
highscore lists to the static trigonometry app. The implementation is deferred.

## Current Decision

- Keep hosting the app on GitHub Pages.
- Keep SymPy answer checking in the browser through Pyodide/SymPy.
- Use 10 questions per scored round.
- After 10 questions, the round is finished and can be submitted to a
  leaderboard when Supabase is configured and reachable.
- If Supabase is missing or unavailable, the app should remain playable in
  guest mode without online highscores.

## Recommended First Implementation

Use GitHub Pages + Pyodide/SymPy + Supabase Auth/Database.

The browser app keeps doing the quiz logic and local SymPy checks. Supabase adds:

- user registration and login
- a `profiles` table with a public display username
- a `rounds` or `highscores` table for completed 10-question rounds
- Row Level Security policies so users can only write their own score rows
- a public read policy for leaderboard rows that are safe to show

This is simple and fits the current static app architecture. It is not fully
cheat-proof because the browser still computes and submits the score.

## Variant A: Client-Scored Highscores

Architecture:

- GitHub Pages serves the app.
- Pyodide/SymPy checks answers locally in the browser.
- Supabase Auth handles login.
- Supabase Postgres stores profiles and completed rounds.
- The client submits the final score after a 10-question round.

Pros:

- Lowest complexity.
- No custom server to operate.
- Works naturally with GitHub Pages.
- Good enough for normal classroom use where the goal is practice, not a
  tamper-proof competition.

Cons:

- A motivated user can manipulate the browser or call Supabase directly.
- RLS can enforce ownership and value ranges, but cannot prove that a submitted
  score was honestly earned.

Useful database constraints and policies:

- score must be between 0 and 10
- total_questions must be exactly 10
- user_id must equal `auth.uid()`
- username must be unique
- only authenticated users can insert their own finished rounds
- leaderboard reads can be public or restricted to authenticated users

## Variant B: Supabase Edge Functions For Scoring

Architecture:

- GitHub Pages serves the app.
- Supabase Auth handles login.
- Supabase Edge Functions own the round lifecycle.
- The client asks for a round, submits answers, and receives the result.
- The client never inserts highscore rows directly.

Flow:

1. `start_round`: create a 10-question round for the signed-in user.
2. `submit_answer`: receive one answer and evaluate it server-side.
3. `finish_round`: finalize the score and insert the highscore row.

Pros:

- Much harder to fake scores by directly editing browser state.
- Highscore inserts can be blocked for clients and allowed only through the
  function path.
- Still avoids running a separate custom server.

Cons:

- More implementation work.
- If server-side SymPy-equivalent checking is needed, JavaScript/TypeScript
  Edge Functions may not be ideal.
- Requires careful handling of function secrets and RLS.

This is the best Supabase-only upgrade path if the leaderboard becomes more
competitive.

## Variant C: Supabase Auth + External Python Server

Architecture:

- GitHub Pages serves the frontend.
- Supabase Auth handles users and sessions.
- A FastAPI or other Python backend generates rounds and checks answers with
  server-side SymPy.
- Supabase stores profiles and highscores.

Pros:

- Strongest correctness model for SymPy answer checking.
- The server can own task generation, answer checking, and scoring.
- Better suited for real competitions.

Cons:

- Requires backend hosting, deployment, monitoring, and backups.
- More moving parts than the current static app.

Use this only if trustworthy competition scoring becomes a hard requirement.

## Login And Username Options

Supabase Auth is designed around email/password or phone/password login.
Username/password can still be presented in the UI, but the implementation
choice matters.

Option 1: Email + password login, username in profile

- Registration asks for email, username, and password.
- Login uses email and password.
- Leaderboards show username.
- Password reset through email remains possible.
- This is the cleanest Supabase-native option.

Option 2: Username + password UI with synthetic email

- Registration asks for username and password.
- The app internally maps `username` to a synthetic email such as
  `username@trigonometric-functions.local`.
- Email confirmation and email password reset are not useful in this mode.
- This is simpler for pupils, but less standard.

Option 3: True username/password auth outside Supabase Auth

- Use another service or custom server.
- Not recommended for this app unless there is a strong reason.

Recommended start: Option 1 if real email addresses are acceptable, otherwise
Option 2 for classroom pseudonyms.

## Supabase Keys And Secrets

The frontend should only ever receive:

- Supabase project URL
- publishable key / anon key

These values are expected to be visible in a browser app. Protection comes from
Supabase Auth plus Row Level Security.

Never put these in the static app, GitHub Pages, or Git:

- service_role key
- secret keys
- database password
- personal Supabase account password

If Edge Functions are added later, secrets belong in Supabase function secrets,
not in frontend JavaScript.

## Optional Supabase Mode

The app should support both modes:

- Supabase configured and reachable: login, registration, and online highscores
  are enabled.
- Supabase missing or unavailable: guest mode remains available, rounds are
  scored locally, and online highscore submission is disabled.

This avoids blocking classroom use if the external service is down.

## Suggested Tables For Later

Initial minimal schema:

- `profiles`
  - `user_id uuid primary key references auth.users(id)`
  - `username text unique not null`
  - `created_at timestamptz not null default now()`

- `rounds`
  - `id uuid primary key`
  - `user_id uuid not null references auth.users(id)`
  - `score integer not null`
  - `total_questions integer not null default 10`
  - `duration_ms integer`
  - `created_at timestamptz not null default now()`

Possible later additions:

- per-question answer log
- app version
- task type distribution
- skipped question count
- class/group code

## Implementation Order

1. Convert the local quiz to explicit 10-question rounds.
2. Add a local round summary screen after question 10.
3. Add Supabase configuration detection and guest mode.
4. Add registration/login/logout UI.
5. Add profile creation with username.
6. Add highscore submission after a completed round.
7. Add leaderboard view.
8. Consider Edge Functions only if stronger anti-cheat becomes necessary.

