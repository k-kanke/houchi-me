create table if not exists public.clone_activities (
  id             uuid primary key default gen_random_uuid(),
  clone_id       uuid not null references public.clones(id) on delete cascade,
  occurred_at    timestamptz not null,
  location       text not null default '',
  activity_type  text not null default 'exploration',
  summary        text not null,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

alter table public.clone_activities enable row level security;

create policy "clone_activities: own read"
  on public.clone_activities for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = clone_activities.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "clone_activities: own insert"
  on public.clone_activities for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = clone_activities.clone_id
        and clones.user_id = auth.uid()
    )
  );

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  clone_id    uuid not null references public.clones(id) on delete cascade,
  topic_id    uuid references public.topics(id) on delete set null,
  title       text not null,
  body        text not null default '',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes: own read"
  on public.notes for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = notes.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "notes: own insert"
  on public.notes for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = notes.clone_id
        and clones.user_id = auth.uid()
    )
  );
