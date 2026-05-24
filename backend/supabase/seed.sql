-- Demo data for Curio Meet.
-- This file is loaded by `supabase db reset` via supabase/config.toml.

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'demo@curio-meet.local',
  null,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"ミサキ"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into users (id, name, avatar_url, points, title)
values (
  '00000000-0000-0000-0000-000000000001',
  'ミサキ',
  null,
  320,
  '好奇心ビギナー'
)
on conflict (id) do update set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  points = excluded.points,
  title = excluded.title;

insert into experiences (
  id,
  creator_id,
  title,
  description,
  category,
  niche_score,
  location,
  fee,
  point_reward,
  capacity,
  reserved_count,
  media_url,
  scheduled_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'はじめての陶芸ミニ体験',
    '土をこねて、自分だけの小皿を作る初心者向け体験。道具はすべて用意されているので手ぶらでOK。',
    'ものづくり',
    72,
    '下北沢',
    0,
    120,
    6,
    3,
    null,
    '2026-06-06 14:00:00+09'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'フィルムカメラで街歩き',
    '使い捨てフィルムカメラで谷根千を散歩。現像まで体験できます。',
    '写真・散歩',
    81,
    '谷根千',
    500,
    150,
    8,
    5,
    null,
    '2026-06-07 10:00:00+09'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '金継ぎ入門ワークショップ',
    '割れた器を金で繋ぐ日本の伝統技法。自分の器を持参してもOK。',
    '伝統工芸',
    88,
    '蔵前',
    2000,
    180,
    4,
    2,
    null,
    '2026-06-06 13:00:00+09'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'ボードゲーム初心者会',
    '有名ボドゲから変わり種まで。ルール説明から一緒にやります。',
    '遊び・交流',
    55,
    '渋谷',
    0,
    80,
    10,
    6,
    null,
    '2026-06-05 19:00:00+09'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'カリグラフィー体験会',
    'ペン1本で美しい文字を書く西洋書道。自分の名前を英語で書いてみよう。',
    '文字・アート',
    76,
    '表参道',
    1500,
    200,
    6,
    1,
    null,
    '2026-06-03 18:30:00+09'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  niche_score = excluded.niche_score,
  location = excluded.location,
  fee = excluded.fee,
  point_reward = excluded.point_reward,
  capacity = excluded.capacity,
  reserved_count = excluded.reserved_count,
  media_url = excluded.media_url,
  scheduled_at = excluded.scheduled_at;

insert into reservations (id, user_id, experience_id, status, created_at)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'reserved',
  now()
)
on conflict (user_id, experience_id) do update set
  status = excluded.status;

insert into experience_logs (
  id,
  user_id,
  experience_id,
  comment,
  fun_rating,
  again_rating,
  next_interest_tags,
  points_earned,
  created_at
)
values (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '土の手触りが思ったより気持ちよかった。次は湯呑みを作りたい。',
  5,
  4,
  array['陶芸（上級）', '木工'],
  150,
  '2026-04-12 15:30:00+09'
)
on conflict (id) do update set
  comment = excluded.comment,
  fun_rating = excluded.fun_rating,
  again_rating = excluded.again_rating,
  next_interest_tags = excluded.next_interest_tags,
  points_earned = excluded.points_earned;

insert into curiosity_map_items (
  id,
  user_id,
  category,
  level,
  experience_count,
  updated_at
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '陶芸',
    1,
    1,
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'レザー',
    0,
    0,
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'カフェ巡り',
    2,
    2,
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '街歩き',
    1,
    1,
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'ボドゲ',
    1,
    1,
    now()
  )
on conflict (user_id, category) do update set
  level = excluded.level,
  experience_count = excluded.experience_count,
  updated_at = now();

insert into point_transactions (id, user_id, amount, reason, reference_id, created_at)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    170,
    '初期ポイント',
    null,
    '2026-04-01 09:00:00+09'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    150,
    '陶芸体験ログ',
    '30000000-0000-0000-0000-000000000001',
    '2026-04-12 15:30:00+09'
  )
on conflict (id) do update set
  amount = excluded.amount,
  reason = excluded.reason,
  reference_id = excluded.reference_id;
