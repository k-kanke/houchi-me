# 独立 Go サーバー構築と段階的リプレイス計画

> 放置Me の LLM / シミュレーション / 将来の非同期処理基盤

## 1. 目的

放置Me の中核処理を Vercel / Supabase Edge Functions だけに依存しない形へ移行。

まずは独立 Go サーバーを薄く立て、既存の同期 API を HTTP JSON で置き換える。その後、日次シミュレーションや LLM 処理を job / worker 化し、公開サービスとしての遅延・失敗・コスト・同時実行に耐えられる構成へ進める。

## 2. 採用方針

- Backend: Go
- Web framework: Echo
- DB: Supabase Postgres を RDB として利用
- DB access: `pgx` を第一候補
- Auth: Supabase Auth の JWT を Echo middleware で検証
- Authorization: `user_id` と `clone_id` の所有確認を service / repository 層で必ず実施
- API: まず HTTP JSON
- 将来 RPC: Connect RPC / gRPC を検討
- Queue: 初期は Postgres job table、必要になったら Redis / Cloud Tasks / Temporal などを検討
- Deploy: Cloud Run / Fly.io / Render など Docker 前提で選定

## 3. 目標アーキテクチャ

```txt
Next.js frontend
  |
  | Authorization: Bearer <Supabase JWT>
  | HTTP JSON
  v
Go Echo API
  |
  | pgx
  v
Supabase Postgres
  |
  +-- Gemini / other LLM APIs
  +-- Redis or queue service, later
```

公開初期は Next.js から Go API を呼ぶ。ブラウザから直接 Go API を呼ぶ場合も、必ず Supabase JWT を渡し、Go 側で検証。

## 4. リポジトリ構成案

```txt
server/
  go.mod
  go.sum
  cmd/
    api/
      main.go
  internal/
    config/
    db/
    auth/
    httpapi/
      router.go
      middleware.go
      handlers/
    repository/
    service/
      simulation/
      chat/
      encounter/
      daily/
    llm/
      gemini/
    jobs/
    domain/
```

既存の `frontend/` と `backend/supabase/` は残す。最初から大きな monorepo 整理はしない。

## 5. 段階的な作業計画

### Phase 0: 境界整理

- [ ] 既存 API の棚卸しを行う
  - `backend/supabase/functions/simulate-clone-day`
  - `backend/supabase/functions/clone-chat`
  - `backend/supabase/functions/encounter-dialogue`
  - `backend/supabase/functions/apply-daily-answers`
  - `frontend/src/app/api/room-chat/*`
  - `frontend/src/app/api/encounter/*`
- [ ] 各 API の入力、出力、保存先、認証要件、失敗時挙動を表にする
- [ ] 最初に Go 化する対象を `simulate-clone-day` に決める
- [ ] Go API の env 一覧を定義する
  - `DATABASE_URL`
  - `SUPABASE_JWT_SECRET` または JWKS 設定
  - `SUPABASE_URL`
  - `GEMINI_API_KEY`
  - `APP_ENV`
  - `CORS_ALLOWED_ORIGINS`

完了条件:

- Go サーバーが担う責務と、当面残す Supabase Edge Functions / Next API Route が明確になっている。

### Phase 1: Go API scaffold

- [ ] `server/` を作成する
- [ ] Go module を初期化する
- [ ] Echo を導入する
- [ ] `GET /health` を実装する
- [ ] config loader を実装する
- [ ] structured logging を入れる
- [ ] request id middleware を入れる
- [ ] CORS 設定を入れる
- [ ] graceful shutdown を実装する
- [ ] Dockerfile を追加する

完了条件:

- `go run ./cmd/api` で API が起動する。
- `GET /health` が 200 を返す。
- Docker build が通る。

### Phase 2: Auth middleware

- [ ] `Authorization: Bearer <token>` を必須にする middleware を作る
- [ ] Supabase JWT の署名検証方式を決める
  - JWKS 検証を優先
  - 難しい場合は初期実装のみ JWT secret 検証で開始
- [ ] `sub` を `user_id` として Echo context に格納する
- [ ] `exp`, `iss`, `aud` の検証を入れる
- [ ] 認証不要 route は `/health` のみに限定する
- [ ] middleware の unit test を追加する

完了条件:

- 認証なしの protected route は 401 になる。
- 有効な Supabase JWT では `user_id` を handler から取得できる。

### Phase 3: DB access と所有権チェック

- [ ] `pgxpool` を設定する
- [ ] repository 層を作る
- [ ] `GetOwnedClone(ctx, userID, cloneID)` を実装する
- [ ] SQL は必ず `where id = $1 and user_id = $2` の形で所有者条件を含める
- [ ] `topics`, `clone_activities`, `notes`, `messages`, `daily_question_answers`, `encounter_logs` の読み書き関数を必要分だけ実装する
- [ ] DB transaction helper を用意する

完了条件:

- 他ユーザーの `clone_id` を指定しても 404 または 403 になる。
- Go service 経由で clone, topic, activity, note を読み書きできる。

### Phase 4: `simulate-clone-day` の Go 移植

- [ ] 既存の `simulate-clone-day` の処理を Go service に移す
  - clone 取得
  - 当日 topic の重複確認
  - recent topics 取得
  - prompt 組み立て
  - Gemini JSON 生成
  - fallback topic
  - activities 生成
  - note 生成
  - DB 保存
- [ ] `POST /v1/clones/:cloneId/simulate-day` を実装する
- [ ] idempotency を維持する
  - `(clone_id, date_key)` の既存 topic があれば再生成しない
- [ ] LLM timeout を設定する
- [ ] Gemini 失敗時の fallback を維持する
- [ ] integration test を追加する

完了条件:

- Go API 経由で日次 Topic / activity / note が保存される。
- 既存 Edge Function と同等のレスポンスを返せる。
- 同じ日に複数回呼んでも重複生成されない。

### Phase 5: frontend の呼び出し切り替え

- [ ] `frontend/src/lib/clone-engine.ts` の API 呼び出し先を切り替え可能にする
  - Supabase Edge Functions
  - Go backend
  - local mock
- [ ] `NEXT_PUBLIC_GO_API_URL` などの env を追加する
- [ ] Supabase session の access token を Go API へ渡す
- [ ] `simulate-clone-day` のみ Go API 経由へ切り替える
- [ ] 失敗時は既存 fallback を維持する

完了条件:

- frontend から Go API の `simulate-day` を呼べる。
- Supabase Edge Function 版へ戻せる feature flag がある。

### Phase 6: Edge Functions の段階的リプレイス

優先順位:

1. [ ] `apply-daily-answers`
2. [ ] `encounter-dialogue`
3. [ ] `clone-chat`
4. [ ] `parse-clone-command`

各 API でやること:

- [ ] 既存 Edge Function の入出力を維持する
- [ ] Go service に移植する
- [ ] DB 保存と所有権チェックを Go 側に寄せる
- [ ] frontend 呼び出しを feature flag で Go API へ切り替える
- [ ] Edge Function は一定期間 fallback として残す
- [ ] 動作確認後、Edge Function 側の責務を縮小または削除する

完了条件:

- LLM / simulation 系の主要処理が Go backend に集約されている。
- Edge Functions は互換 fallback または不要な状態になっている。

### Phase 7: Next API Route の扱い整理

対象:

- `frontend/src/app/api/room-chat/*`
- `frontend/src/app/api/encounter/*`

方針:

- チャットの SSE は当面 Next API Route に残してよい
- LLM 呼び出し、session 保存、summary 生成を Go API に寄せる
- 将来、Go API 側で SSE / WebSocket を持つかを検討する

作業:

- [ ] room-chat の session model を Go 側に移すか判断する
- [ ] encounter の session model を Go 側に移すか判断する
- [ ] Upstash Redis の利用責務を Next 側か Go 側に統一する
- [ ] 同時接続数が増えるまでは SSE 経路を無理に変更しない

完了条件:

- LLM 制御は Go 側へ寄っている。
- realtime / streaming の責務が明文化されている。

### Phase 8: 非同期 job 化

最初の対象:

- `simulate-clone-day`
- encounter summary
- long-term memory summary

作業:

- [ ] `llm_jobs` または `simulation_jobs` テーブルを作る
- [ ] job schema を決める
  - `id`
  - `type`
  - `status`
  - `user_id`
  - `clone_id`
  - `idempotency_key`
  - `payload`
  - `result`
  - `error`
  - `retry_count`
  - `run_after`
  - `created_at`
  - `updated_at`
- [ ] `POST /v1/clones/:cloneId/simulate-day-jobs` を作る
- [ ] worker loop を実装する
- [ ] retry / backoff / dead letter 相当の扱いを入れる
- [ ] frontend は pending 状態を表示する
- [ ] job 完了後は DB の topic / activities / notes を読む

完了条件:

- 画面リクエスト中に重い LLM 生成完了を待たなくてよい。
- job の状態、失敗理由、再試行回数を追える。

### Phase 9: 運用基盤

- [ ] rate limit を入れる
  - user
  - route
  - job type
- [ ] LLM usage logging を入れる
  - model
  - prompt version
  - latency
  - token usage
  - error reason
- [ ] request / job tracing id を統一する
- [ ] metrics を出す
  - request count
  - error count
  - job duration
  - LLM duration
  - retry count
- [ ] production deploy 手順を作る
- [ ] secrets 管理方針を決める

完了条件:

- 本番で障害調査とコスト確認ができる。
- LLM 障害時に fallback / retry / pending 表示で体験を止めない。

## 6. API 案

```txt
GET  /health

POST /v1/clones/:cloneId/simulate-day
POST /v1/clones/:cloneId/daily-answers
POST /v1/clones/:cloneId/chat
POST /v1/clones/:cloneId/encounters

POST /v1/clones/:cloneId/simulate-day-jobs
GET  /v1/jobs/:jobId
```

初期は HTTP JSON で実装する。API 境界が安定したら OpenAPI または proto を導入し、Connect RPC / gRPC 化を検討する。

## 7. セキュリティ方針

- ブラウザに LLM API key を置かない
- Go backend の protected route は Supabase JWT 必須
- service role key を使う場合は Go backend 内に閉じる
- DB 操作は必ず `user_id` 起点で所有権チェックする
- `clone_id` だけで取得・更新しない
- ブラウザから Supabase を直接読む経路が残る間は RLS を維持する
- Go backend 経由の書き込みは audit log / request id を残す

## 8. リプレイス順の判断基準

優先的に Go へ寄せるもの:

- LLM API key を使う処理
- 実行時間が長い処理
- retry / timeout / fallback が必要な処理
- 複数テーブルを transaction で更新する処理
- 将来 job 化したい処理
- コストや rate limit を制御したい処理

当面残してよいもの:

- frontend の表示専用読み取り
- Supabase Auth
- RLS 前提の単純な CRUD
- SSE / streaming UI の薄いプロキシ

## 9. リスクと対策

| Risk | Impact | Mitigation |
|---|---|---|
| TypeScript と Go で型が二重管理になる | API 変更時に壊れやすい | OpenAPI / proto / JSON schema のいずれかを導入する |
| Supabase RLS と Go 権限チェックが二重になる | 実装が複雑になる | ブラウザ直アクセス範囲を減らし、Go 側の所有権チェックを標準化する |
| Edge Function と Go API が併存して混乱する | 障害時の責務が曖昧になる | feature flag とリプレイス表を用意し、完了後に旧経路を削る |
| LLM 処理の移植で prompt 品質が変わる | 体験が劣化する | 既存 prompt と fallback を先にそのまま移植し、改善は後で行う |
| Go backend の運用負荷が増える | デプロイ・監視が必要になる | Docker + managed platform で最小構成から始める |

## 10. 最初の実装スコープ

最初の PR でやること:

- [ ] `server/` scaffold
- [ ] `GET /health`
- [ ] config loader
- [ ] logging / request id / CORS
- [ ] Dockerfile
- [ ] README or runbook

次の PR でやること:

- [ ] Supabase JWT middleware
- [ ] DB connection
- [ ] `GetOwnedClone`
- [ ] `POST /v1/clones/:cloneId/simulate-day`

この順番なら、独立サーバー導入そのものと業務ロジック移植を分けて検証できる。
