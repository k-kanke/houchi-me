# 放置me — 次のステップ：Gemini + Supabase Edge Functions 接続

このドキュメントは、現在の実装を **Gemini + Supabase Edge Functions** 前提でローカルから本番へ寄せるための手順です。

方針は固定です。

- frontend に API キーは置かない
- LLM 呼び出しは Supabase Edge Functions に閉じ込める
- frontend は `CloneEngine` / `Storage` の抽象越しに使う
- 未接続時は `LLMMockImpl` / `LocalStorageImpl` をフォールバックにする

---

## 1. いまの実装

- LLM 共通層: `backend/supabase/functions/_shared/gemini.ts`
- クローン文脈: `backend/supabase/functions/_shared/clone-context.ts`
- Topic 生成: `backend/supabase/functions/simulate-clone-day/index.ts`
- チャット: `backend/supabase/functions/clone-chat/index.ts`
- frontend 抽象: `frontend/src/lib/clone-engine.ts`
- 永続化抽象: `frontend/src/lib/storage.ts`

frontend 側は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が入ると Supabase 経路に切り替わります。

---

## 2. frontend の環境変数

`frontend/.env.example` をコピーして `frontend/.env.local` を作る。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

補足:

- `SUPABASE_SERVICE_ROLE_KEY` は frontend では使わない
- `GEMINI_API_KEY` は frontend に置かない

---

## 3. Edge Functions の環境変数

`backend/supabase/.env.example` をコピーして `backend/supabase/.env.local` を作る。

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=models/gemini-2.5-flash
```

`GEMINI_MODEL` は省略可能です。未設定時は `models/gemini-2.5-flash` を使います。

---

## 4. ローカル Supabase 起動

`backend/supabase` で実行:

```bash
supabase start
supabase db reset
```

これで migrations と seed がローカル DB に反映されます。

今回の LLM 系で必要な追加テーブルは migration に含めています。

- `clone_activities`
- `notes`

---

## 5. Secret の投入

`backend/supabase` で実行:

```bash
supabase secrets set --env-file .env.local
```

本番でも同じ考え方です。`GEMINI_API_KEY` は Supabase 側 Secret にだけ置きます。

---

## 6. Edge Functions のローカル実行

`backend/supabase` で実行:

```bash
supabase functions serve --env-file .env.local
```

使う function:

- `clone-chat`
- `simulate-clone-day`

---

## 7. frontend 起動

`frontend` で実行:

```bash
npm install
npm run dev
```

`http://localhost:3000` を開く。

初回は onboarding で clone を作成し、その後:

- Topic 表示: `simulate-clone-day`
- チャット送信: `clone-chat`

が使われます。

---

## 8. 動作確認

### Topic

1. `frontend/.env.local` を入れる
2. Supabase local と functions serve を起動する
3. onboarding 後にホームを開く
4. 当日の Topic が未生成なら `simulate-clone-day` が呼ばれる
5. `topics` に加えて `clone_activities` と `notes` が保存される

### Chat

1. チャットタブを開く
2. メッセージを送る
3. `clone-chat` が Gemini を呼ぶ
4. 応答が表示され、`messages` に user / clone の両方が保存される

---

## 9. 失敗時の確認ポイント

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が frontend に入っているか
- `GEMINI_API_KEY` が `backend/supabase/.env.local` に入っているか
- `supabase start` が起動しているか
- `supabase functions serve --env-file .env.local` を別ターミナルで動かしているか
- `messages`, `topics`, `clone_activities`, `notes` の migration が反映済みか

frontend が Supabase 未接続なら、モックに戻る挙動です。

---

## 10. 実装上の責務

### HO-110

- `functions/_shared/gemini.ts`
- Gemini 共通クライアント
- モデル名
- 共通エラーハンドリング
- JSON レスポンス補助

### HO-111

- `functions/_shared/clone-context.ts`
- system prompt
- clone 文脈
- topic / chat 用の入力組み立て

### HO-113

- `functions/clone-chat/index.ts`
- Gemini 応答生成
- `messages` 保存

### HO-114

- `functions/simulate-clone-day/index.ts`
- 1日分の活動・Topic・note 生成
- `topics` / `clone_activities` / `notes` 保存

---

## 11. 次の対象

未着手または拡張余地があるのは以下です。

- `HO-115` `encounter-dialogue`
- `HO-116` `apply-daily-answers`
- `HO-117` UI の本番データ接続の詰め

ここから先も方針は同じで、frontend 直 API 呼び出しではなく Edge Functions 経由で寄せる。
