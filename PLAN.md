# PLAN

> Current planning draft from 2026-06-04.
> The previous plan is kept as `project-docs/archived-plan-2026-05.md`.

## 1. 目的

放置Me をハッカソンMVPから継続運用できるサービスへ寄せる。特に、LLM処理・記憶コンテキスト・ユーザー分離・トラフィック耐性を整え、複数ユーザーが同時に使っても体験とデータ整合性が崩れない状態を目指す。

## 2. 現在地

- Next.js frontend と Supabase Edge Functions の接続経路はある。
- Gemini 呼び出しは `clone-chat` / `simulate-clone-day` / room-chat / encounter 系で使われている。
- `profiles` / `clones` / `topics` / `messages` / `feedback` など、ユーザー単位の基本データモデルはある。
- 現状はリクエスト中にLLM応答を待つ同期処理が中心で、遅延・タイムアウト・リトライ・重複実行への耐性が弱い。
- 記憶コンテキストは増え続ける可能性があり、トークン量・関連度・古い記憶の扱いを制御する仕組みが必要。
- 複数ユーザーの同時利用、クローン同士の遭遇、公開範囲、RLS、rate limit の設計を詰める必要がある。

## 3. 次に決めること

- [ ] LLM処理をどこまで非同期化するか: chat は同期維持、topic / daily simulation / encounter summary はjob化、など。
- [ ] job queue の実装方式: Supabase table queue、pg_cron、Edge Function scheduled job、外部queueのどれを使うか。
- [ ] 記憶コンテキストの階層: short-term messages、daily notes、long-term profile summary、interest vectors をどう分けるか。
- [ ] 複数ユーザー共存の公開範囲: 自分専用、フレンド、同じ部屋、匿名遭遇ログのどこまで許可するか。
- [ ] トラフィック対策の優先順位: rate limit、cache、idempotency、background retry、observability の順序。
- [ ] 本番で使うLLMモデルとコスト上限: 用途別モデル、最大トークン、1ユーザーあたりの生成回数。
- [ ] クラウド化の範囲: Vercel + Supabase 継続、worker / queue だけ外出し、全面的な cloud infra 化のどこまで進めるか。
- [ ] Terraform 管理対象: DNS、hosting、queue、worker、secrets、monitoring、database 周辺のうち、何をIaC化するか。

## 4. やること

| Priority | ID | Task | Owner | Status | Notes |
|---|---|---|---|---|---|
| P0 | HO-SCALE-001 | LLM呼び出し箇所の棚卸し | TBD | Todo | `clone-chat`, `simulate-clone-day`, `encounter-dialogue`, Next.js API routes を対象に、同期/非同期、入力、出力、保存先、失敗時挙動を一覧化する。 |
| P0 | HO-SCALE-002 | LLM job テーブル設計 | TBD | Todo | `llm_jobs` を作り、status, type, clone_id, idempotency_key, payload, result, error, retry_count を持たせる。 |
| P0 | HO-SCALE-003 | topic / daily simulation の非同期化 | TBD | Todo | 画面表示中に生成完了を待たず、pending 状態を表示して background job で `topics` / `clone_activities` / `notes` を保存する。 |
| P0 | HO-SCALE-004 | idempotency と重複実行防止 | TBD | Todo | `(clone_id, date_key, job_type)` などでユニーク制約を作り、再読み込みや多重クリックでLLM生成が重複しないようにする。 |
| P1 | HO-MEM-001 | 記憶コンテキストの分類設計 | TBD | Todo | messages, notes, daily_answers, profile, encounter_logs を短期/中期/長期に分け、prompt投入条件を定義する。 |
| P1 | HO-MEM-002 | context builder の最適化 | TBD | Todo | 関連度、鮮度、重要度、トークン上限でコンテキストを選ぶ。まずはルールベースで実装し、必要なら embedding 検索に拡張する。 |
| P1 | HO-MEM-003 | long-term memory summary の導入 | TBD | Todo | 会話履歴をそのまま詰めず、定期的にユーザー嗜好・避けたいもの・最近の関心へ要約して保持する。 |
| P1 | HO-MULTI-001 | ユーザー/クローン分離の再確認 | TBD | Todo | RLS、service role 使用箇所、API route の認証、clone ownership の検証漏れを確認する。 |
| P1 | HO-MULTI-002 | 複数クローン遭遇の権限制御 | TBD | Todo | encounter logs の見える範囲、相手ユーザー情報の匿名化、共有可能な会話内容を定義する。 |
| P1 | HO-SCALE-005 | rate limit とquota | TBD | Todo | user_id / route / job_type ごとの制限を置き、LLMコストとスパイクを抑える。 |
| P1 | HO-INFRA-001 | クラウド化方針の比較 | TBD | Todo | Vercel + Supabase 継続案、queue/worker だけ外出し案、AWS/GCP などへの拡張案を、運用負荷・費用・実装速度で比較する。 |
| P1 | HO-INFRA-002 | Terraform 導入範囲の決定 | TBD | Todo | 最初から全面IaC化せず、環境変数、queue、worker、監視、DNS など変更頻度と事故リスクが高いものから管理対象を決める。 |
| P2 | HO-SCALE-006 | cache と再利用 | TBD | Todo | 同一日のtopic、同一context summary、静的なwild avatar profile などを再生成しない。 |
| P2 | HO-SCALE-007 | observability | TBD | Todo | job duration、LLM token usage、error reason、retry count、ユーザー影響をログ/テーブルで追えるようにする。 |
| P2 | HO-SCALE-008 | graceful degradation | TBD | Todo | LLM障害時は既存topic、モック応答、pending表示、再試行導線で体験を止めない。 |
| P2 | HO-INFRA-003 | Terraform scaffold | TBD | Todo | 採用範囲が決まったら `infra/terraform` を作り、dev / prod の分離、state 管理、secret 注入方針を決める。 |

## 5. 決定事項

- ブラウザ公開変数には API key を置かない。
- LLM API key は server-only env / Supabase secret で扱う。
- frontend は直接LLMを呼ばず、Next.js API routes または Supabase Edge Functions 経由にする。
- MVPの互換性として、Supabase未接続時は `LLMMockImpl` / `LocalStorageImpl` へフォールバックする。
- スキーマ変更は `backend/supabase/migrations/` で管理する。

## 6. 保留・後回し

- embedding / vector search の導入。まずはルールベースのcontext selectionで十分か検証する。
- 外部queueサービスの導入。Supabase内のjob tableで足りなくなった段階で検討する。
- フレンド機能と公開プロフィール。複数ユーザー共存の基盤を先に固める。
- LLMモデルの用途別切り替え。コスト・品質・遅延の実測後に決める。
- 全面クラウド移行。まずは Vercel + Supabase を活かしつつ、queue / worker / monitoring など詰まりやすい箇所から外出しを検討する。

## 7. 完了したこと

- MVPとして、Next.js frontend、3D仮想世界、Supabase連携、Gemini連携の基本経路を実装済み。
- `clone-chat` と `simulate-clone-day` の Edge Function 経路を用意済み。
- `profiles` / `clones` / `topics` / `messages` / `feedback` などの基本テーブルとRLS方針を用意済み。
