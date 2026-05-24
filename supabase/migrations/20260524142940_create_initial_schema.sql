-- users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'ゲスト',
  avatar_url text,
  points integer not null default 0,
  title text not null default '好奇心の芽',
  created_at timestamptz not null default now()
);

alter table users enable row level security;

create policy "public read" on users for select using (true);
create policy "owner update" on users for update using (auth.uid() = id);


-- experiences
create table experiences (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  niche_score integer not null default 50,
  location text,
  fee integer not null default 0,
  point_reward integer not null default 100,
  capacity integer not null default 10,
  reserved_count integer not null default 0,
  media_url text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table experiences enable row level security;

create policy "public read" on experiences for select using (true);
create policy "owner insert" on experiences for insert with check (auth.uid() = creator_id);
create policy "owner update" on experiences for update using (auth.uid() = creator_id);


-- reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  status text not null default 'reserved' check (status in ('reserved', 'joined', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (user_id, experience_id)
);

alter table reservations enable row level security;

create policy "owner read" on reservations for select using (auth.uid() = user_id);
create policy "owner insert" on reservations for insert with check (auth.uid() = user_id);


-- experience_logs
create table experience_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  comment text,
  fun_rating integer check (fun_rating between 1 and 5),
  again_rating integer check (again_rating between 1 and 5),
  next_interest_tags text[],
  points_earned integer not null default 0,
  created_at timestamptz not null default now()
);

alter table experience_logs enable row level security;

create policy "public read" on experience_logs for select using (true);
create policy "owner insert" on experience_logs for insert with check (auth.uid() = user_id);


-- curiosity_map_items
create table curiosity_map_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  level integer not null default 1,
  experience_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table curiosity_map_items enable row level security;

create policy "owner read" on curiosity_map_items for select using (auth.uid() = user_id);
create policy "owner insert" on curiosity_map_items for insert with check (auth.uid() = user_id);
create policy "owner update" on curiosity_map_items for update using (auth.uid() = user_id);


-- point_transactions
create table point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table point_transactions enable row level security;

create policy "owner read" on point_transactions for select using (auth.uid() = user_id);
