# DB 運用ルール

## 構成

- スキーマ変更は `backend/supabase/migrations/` に SQL ファイルで管理
- GUI（Supabase ダッシュボード）では確認のみ行い、直接編集しない

## マイグレーションファイルの作り方

```bash
cd backend/supabase
supabase migration new <名前>
# 例: supabase migration new add_saved_experiences
```

`backend/supabase/migrations/<timestamp>_<名前>.sql` が生成されるので SQL を書く。

## DB への適用

```bash
cd backend/supabase
supabase db push
```

リモートの Supabase DB に未適用のマイグレーションをすべて適用する。

## 現在のマイグレーション一覧確認

```bash
cd backend/supabase
supabase migration list
```

## テーブル一覧

| テーブル | 概要 |
|----------|------|
| `users` | ユーザー情報（pt・称号） |
| `experiences` | 体験会 |
| `reservations` | 予約（status: reserved / joined / cancelled） |
| `experience_logs` | 参加後ログ |
| `curiosity_map_items` | 好奇心マップ（ユーザー × カテゴリ） |
| `point_transactions` | ポイント履歴 |

## RLS 方針

- 読み取り: `experiences`, `experience_logs` は全員公開
- 書き込み: 本人（`auth.uid()`）または Edge Function（service_role キー）のみ
- `reservations`, `curiosity_map_items`, `point_transactions` は本人のみ読み書き可
