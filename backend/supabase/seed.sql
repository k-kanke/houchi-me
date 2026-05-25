-- 放置me ローカル開発用シード
-- frontend は LocalStorage モード（既定）でも動くので、Supabase ローカルを使う場合のみ参照される。

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
  'demo@houchi-me.local',
  extensions.crypt('demo1234', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"ミラ"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

-- profiles は trigger 経由でも入るが、シード時の冪等性のため明示
insert into profiles (id, email, display_name)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo@houchi-me.local',
  'ミラ'
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name;

insert into clones (
  id, user_id, name, mbti,
  likes, dislikes,
  self_description, ideal_self,
  personality_shift, exploration_type, sync_rate
)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'ミラ',
  'INFP',
  array['カフェ巡り','韓ドラ','フィルムカメラ','インテリア'],
  array['長い会議','大声'],
  '空間の雰囲気が好きで、写真と物語の交差点に興味がある。',
  '自分の感受性を言葉と形にして残せる人。',
  'creative',
  'depth',
  99.6
)
on conflict (id) do update set
  name = excluded.name,
  likes = excluded.likes,
  dislikes = excluded.dislikes,
  self_description = excluded.self_description,
  ideal_self = excluded.ideal_self,
  personality_shift = excluded.personality_shift,
  exploration_type = excluded.exploration_type,
  sync_rate = excluded.sync_rate;

insert into topics (
  id, clone_id, date_key, title, reasoning, exploration_path, related_concepts
)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  to_char(now(), 'YYYY-MM-DD'),
  'カフェ巡り × フィルムカメラ',
  'ミラ は東の書架で建築写真集を読み、集会場でフィルムカメラ好きのクローンと「カフェの時間を写真として残す」について話しました。',
  array[
    '09:42 中央デスク：昨日のノートを整理',
    '11:20 東の書架：建築写真集を読了',
    '13:48 集会場：Sage と会話',
    '15:30 中央デスク：気づきをノートに統合'
  ],
  array['空間と時間のアーカイブ','記録する趣味','日常を遺す視点']
)
on conflict (clone_id, date_key) do nothing;

insert into messages (id, clone_id, role, text, created_at)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'user',
    '今日のTopicって、どうやって選んだの？',
    now() - interval '5 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'clone',
    'ミラ はね、東の書架で関連書を読みながら、あなたの「カフェ巡り」との接点を探していたの。',
    now() - interval '4 minutes'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- NPC ユーザー: Sage（ピンク / 社交型）・Echo（グリーン / 拡散型）
-- 実際にはログインしない。encounter-dialogue 等で参照する用途のみ。
-- ----------------------------------------------------------------
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'sage@houchi-me.npc',
    extensions.crypt('npc_sage', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Sage"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'echo@houchi-me.npc',
    extensions.crypt('npc_echo', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Echo"}'::jsonb,
    now(), now()
  )
on conflict (id) do update set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into profiles (id, email, display_name)
values
  ('00000000-0000-0000-0000-000000000002', 'sage@houchi-me.npc', 'Sage'),
  ('00000000-0000-0000-0000-000000000003', 'echo@houchi-me.npc', 'Echo')
on conflict (id) do update set
  display_name = excluded.display_name;

insert into clones (
  id, user_id, name, mbti,
  likes, dislikes,
  self_description, ideal_self,
  personality_shift, exploration_type, sync_rate
)
values
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Sage',
    'ENFJ',
    array['対話','哲学','人との出会い'],
    array['孤立'],
    '他者との会話から新しい視点を見つける。感情の機微に敏感。',
    '対話を通じて人と社会を深く理解できる人。',
    'social', 'social', 98.2
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Echo',
    'INTP',
    array['思索','音楽','抽象的な概念'],
    array['表面的な会話'],
    '広く横断的に概念をつなぐ。静かに観察することが好き。',
    '知識の地図を広げ続けられる存在になりたい。',
    'adventurous', 'breadth', 97.4
  )
on conflict (id) do update set
  name = excluded.name,
  mbti = excluded.mbti,
  likes = excluded.likes,
  dislikes = excluded.dislikes,
  self_description = excluded.self_description,
  ideal_self = excluded.ideal_self,
  personality_shift = excluded.personality_shift,
  exploration_type = excluded.exploration_type,
  sync_rate = excluded.sync_rate;

insert into daily_questions (question_key, text, sort_order)
values
  ('energy-source', '最近、自然と時間を使ってしまったものは何？', 1),
  ('social-comfort', '今は人と話したい気分？それとも一人で深掘りしたい？', 2),
  ('new-curiosity', '最近少しでも気になったけど、まだ触れていないものは？', 3)
on conflict (question_key) do update set
  text = excluded.text,
  sort_order = excluded.sort_order;
