insert into public.daily_questions (question_key, text, sort_order)
values
  ('energy-source', '最近、自然と時間を使ってしまったものは何？', 1),
  ('social-comfort', '今は人と話したい気分？それとも一人で深掘りしたい？', 2),
  ('new-curiosity', '最近少しでも気になったけど、まだ触れていないものは？', 3),
  ('avoid-today', '今日は避けたいもの、気が進まないものは？', 4),
  ('future-self', '明日の自分に少しだけ近づくなら、何を試したい？', 5)
on conflict (question_key) do update set
  text = excluded.text,
  sort_order = excluded.sort_order;
