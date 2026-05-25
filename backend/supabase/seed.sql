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
