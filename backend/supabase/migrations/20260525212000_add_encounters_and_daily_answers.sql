alter table public.clones
  add column if not exists vitals jsonb not null default '{"focus":62,"energy":58,"curiosity":71}'::jsonb;

create table if not exists public.clone_encounters (
  id           uuid primary key default gen_random_uuid(),
  clone_id     uuid not null references public.clones(id) on delete cascade,
  partner_name text not null,
  location     text not null default '集会場',
  dialogue     jsonb not null default '[]'::jsonb,
  cross_topic  text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.clone_encounters enable row level security;

create policy "clone_encounters: own read"
  on public.clone_encounters for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = clone_encounters.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "clone_encounters: own insert"
  on public.clone_encounters for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = clone_encounters.clone_id
        and clones.user_id = auth.uid()
    )
  );

create table if not exists public.daily_questions (
  id           uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  text         text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.daily_questions enable row level security;

create policy "daily_questions: read all"
  on public.daily_questions for select
  using (true);

create table if not exists public.daily_question_answers (
  id           uuid primary key default gen_random_uuid(),
  clone_id     uuid not null references public.clones(id) on delete cascade,
  question_id  uuid not null references public.daily_questions(id) on delete cascade,
  answer       text not null,
  answered_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table public.daily_question_answers enable row level security;

create policy "daily_question_answers: own read"
  on public.daily_question_answers for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = daily_question_answers.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "daily_question_answers: own insert"
  on public.daily_question_answers for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = daily_question_answers.clone_id
        and clones.user_id = auth.uid()
    )
  );
