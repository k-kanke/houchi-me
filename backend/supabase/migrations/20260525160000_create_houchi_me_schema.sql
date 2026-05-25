-- 放置me スキーマ
-- frontend/src/types/index.ts の型定義と 1:1 対応

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- auth.users INSERT 時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- clones
-- ----------------------------------------------------------------
create table if not exists public.clones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  mbti                text not null default '',
  likes               text[] not null default '{}',
  dislikes            text[] not null default '{}',
  self_description    text not null default '',
  ideal_self          text not null default '',
  personality_shift   text not null default 'stay',
  exploration_type    text not null default 'depth',
  sync_rate           numeric(5,2) not null default 99.0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id)
);

alter table public.clones enable row level security;

create policy "clones: own read"
  on public.clones for select
  using (auth.uid() = user_id);

create policy "clones: own insert"
  on public.clones for insert
  with check (auth.uid() = user_id);

create policy "clones: own update"
  on public.clones for update
  using (auth.uid() = user_id);

create policy "clones: own delete"
  on public.clones for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- topics
-- ----------------------------------------------------------------
create table if not exists public.topics (
  id                uuid primary key default gen_random_uuid(),
  clone_id          uuid not null references public.clones(id) on delete cascade,
  date_key          text not null,
  title             text not null,
  reasoning         text not null default '',
  exploration_path  text[] not null default '{}',
  related_concepts  text[] not null default '{}',
  created_at        timestamptz not null default now(),
  unique (clone_id, date_key)
);

alter table public.topics enable row level security;

create policy "topics: own read"
  on public.topics for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = topics.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "topics: own insert"
  on public.topics for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = topics.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "topics: own update"
  on public.topics for update
  using (
    exists (
      select 1 from public.clones
      where clones.id = topics.clone_id
        and clones.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  clone_id    uuid not null references public.clones(id) on delete cascade,
  role        text not null check (role in ('user', 'clone')),
  text        text not null,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: own read"
  on public.messages for select
  using (
    exists (
      select 1 from public.clones
      where clones.id = messages.clone_id
        and clones.user_id = auth.uid()
    )
  );

create policy "messages: own insert"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.clones
      where clones.id = messages.clone_id
        and clones.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- feedback
-- ----------------------------------------------------------------
create table if not exists public.feedback (
  topic_id    uuid primary key references public.topics(id) on delete cascade,
  kind        text not null check (kind in ('interested', 'different', 'more')),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "feedback: own read"
  on public.feedback for select
  using (
    exists (
      select 1 from public.topics
      join public.clones on clones.id = topics.clone_id
      where topics.id = feedback.topic_id
        and clones.user_id = auth.uid()
    )
  );

create policy "feedback: own insert"
  on public.feedback for insert
  with check (
    exists (
      select 1 from public.topics
      join public.clones on clones.id = topics.clone_id
      where topics.id = feedback.topic_id
        and clones.user_id = auth.uid()
    )
  );

create policy "feedback: own update"
  on public.feedback for update
  using (
    exists (
      select 1 from public.topics
      join public.clones on clones.id = topics.clone_id
      where topics.id = feedback.topic_id
        and clones.user_id = auth.uid()
    )
  );
