create table if not exists public.quest_ai_budget (
  user_id text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);
alter table public.quest_ai_budget enable row level security;
revoke all on public.quest_ai_budget from anon, authenticated;
grant all on public.quest_ai_budget to service_role;
create or replace function public.claim_quest_generation(owner_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare allowed boolean;
begin
  insert into quest_ai_budget(user_id, count) values(owner_id, 1)
  on conflict(user_id) do update set
    count = case when quest_ai_budget.window_start < now() - interval '1 hour' then 1 else quest_ai_budget.count + 1 end,
    window_start = case when quest_ai_budget.window_start < now() - interval '1 hour' then now() else quest_ai_budget.window_start end
  returning count <= 10 into allowed;
  return allowed;
end;
$$;
revoke all on function public.claim_quest_generation(text) from public, anon, authenticated;
grant execute on function public.claim_quest_generation(text) to service_role;
