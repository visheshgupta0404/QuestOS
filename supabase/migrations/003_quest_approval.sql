-- Approve the candidate scope before gameplay; exact mutations still need final approval.
alter table public.quest_plans add column if not exists play_approved boolean not null default false;
