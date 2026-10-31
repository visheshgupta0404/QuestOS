-- Run once in Supabase SQL Editor. No browser credentials or public table access.
create table if not exists public.quest_plans (
  id uuid primary key,
  user_id text not null,
  messages jsonb not null,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists quest_plans_owner on public.quest_plans(user_id, created_at desc);
create table if not exists public.quest_receipts (
  id uuid primary key references public.quest_plans(id),
  user_id text not null,
  status text not null check (status in ('executing','verified','partial','failed','undoing','undone')),
  count integer not null default 0,
  changes jsonb not null default '[]',
  detail text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quest_receipts_owner on public.quest_receipts(user_id, created_at desc);
alter table public.quest_plans enable row level security;
alter table public.quest_receipts enable row level security;
revoke all on public.quest_plans, public.quest_receipts from anon, authenticated;
grant all on public.quest_plans, public.quest_receipts to service_role;
-- The Next.js server authenticates the sealed Google session and scopes EVERY query
-- to Google's immutable subject ID. The service role stays server-only.
-- Schedule retention in your project: delete expired unclaimed plans after 24h;
-- delete receipts/plans after your documented retention period (e.g. 30 days).
