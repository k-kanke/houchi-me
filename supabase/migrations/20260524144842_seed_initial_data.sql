create extension if not exists pgcrypto;

-- デモユーザーを auth.users に挿入
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  aud, role
) values (
  '00000000-0000-0000-0000-000000000001',
  'demo@curio-meet.app',
  extensions.crypt('demo1234', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated', 'authenticated'
) on conflict (id) do nothing;

-- デモユーザーを public.users に挿入
insert into users (id, name, avatar_url, points, title) values (
  '00000000-0000-0000-0000-000000000001',
  'ミサキ',
  null,
  320,
  '好奇心ビギナー'
) on conflict (id) do nothing;

-- 体験会シードデータ
insert into experiences (id, creator_id, title, description, category, niche_score, location, fee, point_reward, capacity, reserved_count, scheduled_at) values
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'はじめての陶芸ミニ体験',
  '土をこねて、自分だけの小皿を作る初心者向け体験。道具はすべて用意されているので手ぶらでOK。',
  'ものづくり',
  60,
  '下北沢',
  0,
  120,
  6,
  3,
  now() + interval '7 days'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'フィルムカメラで街歩き',
  '使い捨てフィルムカメラで谷根千を散歩。現像まで体験できます。',
  '写真・散歩',
  70,
  '谷根千',
  500,
  150,
  8,
  5,
  now() + interval '8 days'
),
(
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000001',
  '金継ぎ入門ワークショップ',
  '割れた器を金で繋ぐ日本の伝統技法。自分の器を持参してもOK。',
  '伝統工芸',
  85,
  '蔵前',
  2000,
  180,
  4,
  2,
  now() + interval '9 days'
),
(
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000001',
  'ボードゲーム初心者会',
  '有名ボドゲから変わり種まで。ルール説明から一緒にやります。',
  '遊び・交流',
  40,
  '渋谷',
  0,
  80,
  10,
  6,
  now() + interval '3 days'
),
(
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000001',
  'カリグラフィー体験会',
  'ペン1本で美しい文字を書く西洋書道。自分の名前を英語で書いてみよう。',
  '文字・アート',
  75,
  '表参道',
  1500,
  200,
  6,
  1,
  now() + interval '5 days'
)
on conflict (id) do nothing;

-- デモユーザーの好奇心マップ初期データ
insert into curiosity_map_items (user_id, category, level, experience_count) values
('00000000-0000-0000-0000-000000000001', 'ものづくり', 1, 1),
('00000000-0000-0000-0000-000000000001', '写真・散歩', 2, 2),
('00000000-0000-0000-0000-000000000001', '遊び・交流', 1, 1)
on conflict (user_id, category) do nothing;
