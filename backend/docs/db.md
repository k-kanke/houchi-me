# DB 運用ルール — 放置me

## 構成

- スキーマ変更は `backend/supabase/migrations/` に SQL ファイルで管理
- GUI（Supabase ダッシュボード）では確認のみ行い、直接編集しない
- frontend の `LocalStorageImpl` で MVP は完結。Supabase 接続時のみ DB が必要。

## マイグレーションファイルの作り方

```bash
cd backend/supabase
supabase migration new <名前>
# 例: supabase migration new add_daily_question
```

`backend/supabase/migrations/<timestamp>_<名前>.sql` が生成されるので SQL を書く。

## DB への適用

```bash
cd backend/supabase
supabase db push
```

リモートの Supabase DB に未適用のマイグレーションをすべて適用する。

## ローカル DB リセット (シード再読込)

```bash
cd backend/supabase
supabase db reset
```

## 現在のマイグレーション一覧確認

```bash
cd backend/supabase
supabase migration list
```

## テーブル一覧

| テーブル | 概要 |
|----------|------|
| `profiles` | `auth.users` 1:1 のユーザープロフィール |
| `clones` | ユーザーのクローン (現状 1 ユーザー 1 クローン) |
| `topics` | 1日1Topic (`(clone_id, date_key)` ユニーク) |
| `messages` | クローンチャット履歴 (`role`: user / clone) |
| `feedback` | Topic フィードバック (`kind`: interested / different / more) |

詳しくは [`backend/supabase/schema/README.md`](../supabase/schema/README.md)。

## RLS 方針

- すべてのテーブルで RLS 有効
- `profiles` と `clones` は `auth.uid()` 本人のみ
- `topics` / `messages` / `feedback` は紐づく `clones` の所有者のみ
- `auth.users` への INSERT 時に `public.handle_new_user` トリガで `profiles` を自動作成
