-- =============================================================================
-- EXAMHUB — admin + student shared schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- =============================================================================

-- 1. Admin allow-list ---------------------------------------------------------
create table if not exists public.admin_users (
  email text primary key
);

-- Helper used by the policies below. SECURITY DEFINER lets it read admin_users
-- without tripping that table's own row-level security.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_users where email = auth.email());
$$;

alter table public.admin_users enable row level security;

-- A signed-in user may only see their OWN row (this is how the admin app checks
-- whether the login is an admin, without exposing the full admin list).
drop policy if exists "check own admin status" on public.admin_users;
create policy "check own admin status" on public.admin_users
  for select using (auth.email() = email);

-- 2. Question bank ------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  stream text,
  instruction text not null default 'Question',
  prompt text not null,
  options jsonb not null,
  answer int not null check (answer between 0 and 3),
  explanation text not null,
  created_at timestamptz not null default now(),
  constraint options_is_four check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

create index if not exists questions_subject_idx on public.questions (subject);

alter table public.questions enable row level security;

drop policy if exists "anyone can read questions" on public.questions;
create policy "anyone can read questions" on public.questions
  for select using (true);

drop policy if exists "admins insert questions" on public.questions;
create policy "admins insert questions" on public.questions
  for insert with check (public.is_admin());

drop policy if exists "admins update questions" on public.questions;
create policy "admins update questions" on public.questions
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete questions" on public.questions;
create policy "admins delete questions" on public.questions
  for delete using (public.is_admin());

-- 3. Exam attempts (written by the student app when Exam Mode finishes) --------
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  user_email text,
  stream text not null,
  subjects text[] not null,
  subject_scores jsonb not null,          -- e.g. {"mathematics": 82, "english": 75}
  total_score int not null check (total_score between 0 and 400),
  taken_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_idx on public.exam_attempts (user_id);
create index if not exists exam_attempts_taken_at_idx on public.exam_attempts (taken_at desc);

alter table public.exam_attempts enable row level security;

drop policy if exists "students insert own attempts" on public.exam_attempts;
create policy "students insert own attempts" on public.exam_attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "students read own attempts" on public.exam_attempts;
create policy "students read own attempts" on public.exam_attempts
  for select using (auth.uid() = user_id);

drop policy if exists "admins read all attempts" on public.exam_attempts;
create policy "admins read all attempts" on public.exam_attempts
  for select using (public.is_admin());

-- 4. Make yourself the first admin ---------------------------------------------
-- Replace with the email of an account that already exists in Authentication ->
-- Users, then run:
--
--   insert into public.admin_users (email) values ('you@example.com');
