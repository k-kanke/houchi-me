-- エンカウンター会話ログ
create table if not exists public.encounter_logs (
  id          uuid primary key default gen_random_uuid(),
  clone_id    uuid not null references public.clones(id) on delete cascade,
  dialogue    jsonb not null default '[]',
  occurred_at timestamptz not null default now()
);

alter table public.encounter_logs enable row level security;

create policy "encounter_logs: own read"
  on public.encounter_logs for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = encounter_logs.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "encounter_logs: own insert"
  on public.encounter_logs for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = encounter_logs.clone_id
        and clones.user_id = auth.uid()
    )
  );
