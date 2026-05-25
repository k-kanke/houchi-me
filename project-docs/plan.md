# 放置me — 実装プラン（Hackathon 2026/05）

> **プロダクト名**: 放置me  
> **コピー**: あなたのクローンが、知らない自分を見つけてくる。 / 放置しておくほど、あなたが広がる。  
> **モック（正）**: リポジトリ直下 [`index.html`](../index.html) — UI・3D・デザイントークンはここを唯一の参照源とする  
> **設計書**: 本ドキュメント冒頭のプロダクト設計（2026-05 版）

---

## 0. 現状と方針

| 項目 | 内容 |
|------|------|
| 旧プロダクト | Curio Meet（体験会フィード・予約）— `frontend/` に React + Supabase 実装あり |
| 新プロダクト | 放置me — クローンAI × 3D「叡智の図書館」× 1日1Topic |
| モック | `index.html`（Three.js r128、単一HTML、Clone OS v2 UI） |
| 実装方針 | **見た目・3Dはモック移植を最優先**。データ・AI・認証は Supabase を継続利用しスキーマを置き換え |

### 0.1 モックから移植するもの（チェックリスト）

- [x] CSS 変数（`--neon-cyan`, `--bg-0` 等）と glass UI → `frontend/src/styles/world.css`
- [x] グリッドレイアウト: `topbar / sidebar(280) / main / right(340) / command` → `WorldScreen.jsx`
- [x] 3D: 叡智の図書館（半透明書架・中央デスク・天窓・集会場相当の空間） → `initLibraryScene.js`
- [x] アバター: Mira / Sage / Echo パレット、吹き出し、名前タグ
- [x] ウェイポイント巡回 + HUD 連動（座標・速度・現地時刻・パンくず）
- [x] カメラ4種: 追従 / 軌道 / 俯瞰 / シネマ
- [x] ミニマップ（2D canvas）
- [x] 右パネル: いま / 今日のタイムライン / クローン統計（**データはダミー**）
- [x] 左サイド: クローンカード・バイタル・ワールド・ページツリー

### 0.3 現在地（Milestone A 完了 — 2026-05-25）

**デプロイ可能なデモ**まで到達済み。`frontend/` を `npm run dev` / Vercel で開ける。

| 領域 | 状態 | 主なファイル |
|------|------|----------------|
| 3D + UI シェル | 完了 | `WorldScreen.jsx`, `initLibraryScene.js`, `world.css` |
| クローン作成 | **LocalStorage のみ** | `OnboardingModal.jsx`, `hochiDummy.js` |
| Topic / チャット / ノート | **オーバーレイ + 固定ダミー** | `WorldScreen.jsx` 内 overlay |
| Supabase / AI | **未着手** | 旧 Curio スキーマ・画面は残存 |
| デプロイ | `vercel.json` 追加済み | `frontend/vercel.json` |

**まだ Must として未達のもの**: DB 永続化、AI による Topic/チャット、毎日の質問、興味マップ・ノート・タイムラインの専用画面と API 連携。

### 0.4 ここから取り組むタスク（推奨順）

> 着手前は [rule.md](./rule.md) で **LINE 担当宣言** → ブランチ `feat/ho-xxx-...` → PR 時に §10 のチェックを更新。

#### スプリント 1 — データ基盤（最優先・並行可）

バックエンドがないと以降の Must がすべてダミーのままになる。**HO-101 → HO-102 → HO-104** を先に通す。

| 順 | ID | やること | 完了の目安 |
|----|-----|----------|------------|
| 1 | **HO-101** | 放置me 用マイグレーション + RLS | `clones`, `clone_activities`, `daily_topics`, `notes` 等が作成される |
| 2 | **HO-102** | シード（叡智の図書館・4ロケーション・NPC Sage/Echo） | ローカル Supabase で参照データが入る |
| 3 | **HO-104** | オンボーディング → `clones` + `clone_profiles` を Supabase に保存 | LocalStorage から DB へ移行 |
| 4 | **HO-105** | 未作成クローン時はオンボーディングへ（現状ロジックの DB 版） | 新規ユーザーで DB に clone が無いと作成画面 |

#### スプリント 2 — Must 機能の画面と API（FE + BE）

| 順 | ID | やること | 完了の目安 |
|----|-----|----------|------------|
| 5 | **HO-301** | Edge Function `simulate-clone-day`（デモ用「今日を生成」ボタン可） | `daily_topics` + タイムライン行が DB から出る |
| 6 | **HO-302** + **HO-303** | 今日の Topic 専用画面 + フィードバック（気になる/違う/もっと知りたい） | オーバーレイから独立画面へ |
| 7 | **HO-205** + **HO-206** | 右パネル「いま」「タイムライン」を `clone_activities` 購読 | ウェイポイント到達と DB が一致 |
| 8 | **HO-401** + **HO-402** | `clone-chat` EF + チャット画面（クイック質問チップ） | 送信で LLM 応答が返る |
| 9 | **HO-404** + **HO-405** | 毎日の質問 UI + `apply-daily-answers` | 回答後に同期率・バイタルが更新される |
| 10 | **HO-304** + **HO-305** + **HO-306** | 興味マップ・ノート一覧/詳細・左ツリー連動 | ナレッジベースが DB 駆動 |
| 11 | **HO-501** | タイムライン画面（日別・過去遡り） | 右パネル履歴のフルスクリーン版 |

#### スプリント 3 — 仕上げ・発表（Should / インフラ）

| 順 | ID | やること | 備考 |
|----|-----|----------|------|
| 12 | **HO-103** | オンボーディングを設計書どおり項目拡充（苦手・なりたい自分等） | HO-104 後でも可 |
| 13 | **HO-403** | コマンドバー → 指示パース or チャット送信 | 「西の書架へ」デモ |
| 14 | **HO-003** | `WorldScreen` をコンポーネント分割（`WorldLayout`, `CommandBar` 等） | リファクタ・任意 |
| 15 | **HO-004** | `initLibraryScene.js` を `avatars.js` / `waypoints.js` に分割 | 保守性向上・任意 |
| 16 | **HO-502** ~ **HO-506** | フレンド・出会い・性格再設定・探索モード | Should・時間があれば |
| 17 | **HO-601** | Production デモ URL を README に記載 | `main` マージ後 |
| 18 | **HO-602** + **HO-603** | 発表シナリオ doc + スクリーンショット | 提出前 |

#### いま担当を取りやすいタスク（単独で切り出し可能）

| ID | 一人で完結しやすい | ブロッカー |
|----|-------------------|-----------|
| HO-101 | ◎ | なし |
| HO-102 | ◎（HO-101 後） | HO-101 |
| HO-302 | ○（ダミーのまま UI だけ先） | なし |
| HO-304 | ○ | なし |
| HO-501 | ○ | なし |
| HO-601 | ◎ | `main` push 権限 |
| HO-602 | ◎ | なし |

#### 意図的に後回し（Milestone A で十分なもの）

- **HO-006**（`@react-three/fiber`）— 現状の vanilla Three で問題なし
- **HO-005**（Bloom）— オプション。パフォーマンス優先ならスキップ可
- **HO-208**, **HO-202**, **HO-203** — 3D 上は **実装済み**（追加作業は DB 連携のみ）
- 旧 Curio 画面削除 — ビルドに影響しないため **HO-501 以降**でまとめて削除可

### 0.2 MVP 優先度（設計書 §19 対応）

| 優先 | 機能 |
|------|------|
| **Must** | クローン作成、3Dワールドビュー、今日のTopic、理由説明、クローンチャット、毎日の質問、興味マップ、ノート、タイムライン |
| **Should** | 他クローン吹き出し、フレンド、ユーザー間会話、性格変更、ロケーション選好、カメラ切替、ミニマップ |
| **Could** | 音声入力、ランキング、共有カード、リアルタイム会話、複数ワールド、外見カスタム、SNS連携 |

---

## 1. アーキテクチャ

```mermaid
flowchart TB
  subgraph client [Frontend - Vite + React]
    Onboard[クローン作成]
    World[3Dホーム - index.html移植]
    Topic[今日のTopic]
    Chat[クローンチャット]
    Map[興味マップ / ノート / タイムライン]
  end

  subgraph supabase [Supabase]
    Auth[Auth 匿名/メール]
    DB[(PostgreSQL)]
    RT[Realtime - タイムライン/位置]
    EF[Edge Functions]
  end

  subgraph ai [AI Layer]
    Agent[クローン自律シミュレーション]
    TopicGen[1日1Topic生成]
    ChatLLM[深掘りチャット]
    Encounter[クローン間会話生成]
  end

  Onboard --> DB
  World --> RT
  World --> DB
  EF --> Agent
  EF --> TopicGen
  EF --> ChatLLM
  EF --> Encounter
  Agent --> DB
  Chat --> EF
```

### 1.1 技術スタック（確定案）

| 層 | 選定 | 備考 |
|----|------|------|
| フロント | React 18 + Vite + Tailwind（既存） | 3D は `@react-three/fiber` + `three@0.128` **または** `index.html` の Three モジュールを `frontend/src/world/` に分割移植 |
| 3D | Three.js r128（モックと同版） | Bloom は optional（モック同様フォールバック） |
| バック | Supabase（Auth / DB / Realtime / Edge Functions） | 旧 Curio テーブルは非推奨・新マイグレーションで置換 |
| AI | OpenAI API（gpt-4o-mini 等） | 審査用に `AI_USAGE_LOG.md` へ記録必須 |
| インフラ | Vercel（FE）+ Supabase Cloud | 既存 Docker/nginx は維持可 |

### 1.2 画面ルーティング（MVP）

| パス / 画面 ID | 画面 | モック対応 |
|----------------|------|------------|
| `/onboarding` | クローン作成 | — |
| `/` または `/world` | ホーム＝仮想世界ビュー | `index.html` 全体 |
| `/topic/today` | 今日のTopic | 設計書 §14 |
| `/chat` | クローンチャット | コマンドバー + 専用画面 |
| `/map` | 興味マップ | 旧 curiosity_map の置換 |
| `/notes`, `/notes/:id` | ナレッジベース | 左「ページ」ツリー |
| `/timeline` | 履歴（右パネル拡張） | `#timeline` |
| `/friends` | フレンド・出会い | Should |

---

## 2. データモデル（Supabase）

旧スキーマ（`experiences`, `reservations` 等）は **参照のみ**。新規マイグレーション `backend/supabase/migrations/YYYYMMDD_hochi_me_schema.sql` で追加。

### 2.1 コアテーブル

| テーブル | 用途 | 主要カラム |
|----------|------|------------|
| `users` | 人間ユーザー | 既存流用 + `display_name` |
| `clones` | 1ユーザー1クローン（MVP） | `user_id`, `name`, `mbti`, `archetype`, `sync_rate`, `vitals` jsonb, `appearance` jsonb |
| `clone_profiles` | 初回入力・性格オフセット | `likes`, `recent_interests`, `bio`, `ideal_self`, `personality_shift`, `dislikes` |
| `worlds` | 叡智の図書館 等 | `slug`, `name`, `is_default` |
| `locations` | 中央デスク / 東の書架 等 | `world_id`, `slug`, `name`, `position` jsonb |
| `clone_activities` | タイムライン1行 | `clone_id`, `location_id`, `activity_type`, `summary`, `metadata` jsonb, `occurred_at` |
| `daily_topics` | 1日1Topic | `clone_id`, `topic_date`, `title`, `reason`, `source_activity_ids` uuid[] |
| `notes` | クローン執筆ノート | `clone_id`, `parent_id`, `title`, `body`, `tags` |
| `note_links` | バックリンク | `from_note_id`, `to_note_id` |
| `interest_map_nodes` | 興味マップ | `clone_id`, `label`, `kind`, `depth`, `source` |
| `clone_encounters` | 他クローンとの出会い | `clone_a_id`, `clone_b_id`, `location_id`, `dialogue` jsonb, `cross_topic` |
| `friendships` | フレンド | `user_a_id`, `user_b_id`, `status` |
| `chat_messages` | ユーザー↔クローン | `clone_id`, `role`, `content`, `channel` |
| `daily_questions` | マスタ質問 | `question_key`, `text`, `sort_order` |
| `daily_question_answers` | 回答 | `clone_id`, `question_id`, `answer`, `answered_at` |

### 2.2 RLS 方針

- 自分の `clone` / `notes` / `activities` / `chat` のみ CRUD
- `clone_encounters`: 当事者クローンのオーナーのみ read
- デモ用: シードに Sage / Echo 相当の **NPC クローン** を2体投入（モックの会話再現）

### 2.3 Realtime（Should）

- チャンネル `clone:{id}` — 最新 `clone_activities` 1件、`vitals`、現在 `location_id`
- フロントの「いま」カード・ミニマップ・HUD を購読で更新

---

## 3. AI / バックエンドジョブ

| ジョブ | トリガー | 出力 |
|--------|----------|------|
| `simulate-clone-day` | cron 1日1回 or デモボタン | `clone_activities` 複数行 → `daily_topics` 1件 + `notes` |
| `clone-chat` | ユーザーメッセージ | ストリーミング応答 + 必要なら `interest_map_nodes` 更新 |
| `encounter-dialogue` | 2クローンが同ロケーション | `clone_encounters.dialogue` + `cross_topic` |
| `apply-daily-answers` | 質問送信後 | `sync_rate`、vitals、探索バイアス更新 |

**プロンプト設計の要点**

- 入力: `clone_profiles` + 直近7日 activities + 既存 interest_map
- 性格シフト（反転型等）: ロケーション重みを JSON で渡す（設計書 §9）
- Topic 理由: 行動経路を必ず含める（設計書 §14 の例文構造）

---

## 4. フェーズとスケジュール（3日間想定）

| Day | ゴール | デモで見せるもの |
|-----|--------|------------------|
| **Day 1** | モック移植 + クローン作成 + DB 新規 | `index.html` 相当の 3D が React で動く。オンボーディング完了で Mira 表示 |
| **Day 2** | Must のデータ連携 + Topic + チャット + タイムライン | 今日のTopic・理由・関連ノートが DB/AI から出る。質問1セット回答で同期率変化 |
| **Day 3** | Should 一部 + 仕上げ + デプロイ | 他クローン吹き出し、フレンド一覧、発表用シナリオ通し |

---

## 5. タスク一覧

タスク ID は **`HO-xxx`**（放置me）。着手前に [rule.md](./rule.md) の担当宣言・ブランチ命名に従う。

凡例: `[Must]` / `[Should]` / `[Could]` — 設計書 §19

### Phase A — 基盤・モック移植（Day 1 AM）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-001 | — | README / チーム情報を放置me に更新 | `README.md` | PM |
| HO-002 | — | デザイントークンを Tailwind + CSS 変数化 | `frontend/src/styles/tokens.js`, `index.css` | FE |
| HO-003 | Must | `index.html` のレイアウトを React シェルに移植（3D除く） | `WorldLayout.jsx`, 各パネルコンポーネント | FE |
| HO-004 | Must | Three.js シーンを `frontend/src/world/` にモジュール分割 | `LibraryScene.jsx`, `avatars.js`, `waypoints.js` | FE |
| HO-005 | Must | ローダー・CDN フォールバック・Bloom 任意読込（モック同等） | モック `__mira` パターン踏襲 | FE |
| HO-006 | — | `three`, `@react-three/fiber`, `@react-three/drei` 依存追加 | `package.json` | FE / Infra |

### Phase B — クローン作成・DB（Day 1 PM）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-101 | Must | 新スキーママイグレーション + RLS | `migrations/*_hochi_me_schema.sql` | BE |
| HO-102 | Must | シード: 叡智の図書館、4ロケーション、NPC Sage/Echo | `seed.sql` | BE |
| HO-103 | Must | クローン作成画面（設計書 §7, §8） | `OnboardingScreen.jsx` | FE |
| HO-104 | Must | 作成 API: `clones` + `clone_profiles` insert | Supabase client or EF | BE |
| HO-105 | Must | 未作成時は `/onboarding` へリダイレクト | `App.jsx` ルーティング | FE |

### Phase C — 3D ホーム・ライブ UI（Day 1–2）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-201 | Must | 自分のクローンのみ巡回（ウェイポイント → HUD 連動） | モック `updateUIForWaypoint` 相当 | FE |
| HO-202 | Should | カメラ4モード切替 | `#cam-follow` 等 | FE |
| HO-203 | Should | ミニマップ（全クローン位置・発話者パルス） | `#minimap` | FE |
| HO-204 | Must | 左: クローンカード・バイタル・同期率表示 | DB `clones.vitals`, `sync_rate` | FE |
| HO-205 | Must | 右: 「いま」— 現在 activity を表示 | `clone_activities` 最新1件 | FE |
| HO-206 | Must | 右: 今日のタイムライン一覧 | 当日 `clone_activities` | FE |
| HO-207 | Must | 下部コマンドバー UI（送信は Phase E で接続） | `CommandBar.jsx` | FE |
| HO-208 | Should | 他クローン2体 + 吹き出し会話（シード or 固定スクリプト） | モック `conversation[]` | FE |

### Phase D — 今日のTopic・興味マップ・ノート（Day 2）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-301 | Must | Edge Function `simulate-clone-day`（デモ: 即時生成ボタン可） | `functions/simulate-clone-day/` | BE |
| HO-302 | Must | 今日のTopic画面（タイトル・理由・関連ノート3） | `TopicScreen.jsx` | FE |
| HO-303 | Must | フィードバック UI: 気になる / 違う / もっと知りたい | `daily_topics` or `topic_feedback` | FE |
| HO-304 | Must | 興味マップ画面（種別・深さ・未解放） | `InterestMapScreen.jsx` | FE |
| HO-305 | Must | ノート一覧 + 詳細（Notion風簡易 Markdown） | `NotesScreen.jsx` | FE |
| HO-306 | Must | ページツリー ↔ `notes.parent_id` | 左サイドバー連動 | FE |
| HO-307 | Should | ナレッジベース / AIメモリーボールト / 目標の区分 | `notes.kind` 列追加 | BE |

### Phase E — チャット・毎日の質問・同期率（Day 2–3）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-401 | Must | Edge Function `clone-chat`（ストリーミング推奨） | OpenAI + `chat_messages` | BE |
| HO-402 | Must | クローンチャット画面 + クイック質問チップ | `ChatScreen.jsx` | FE |
| HO-403 | Must | コマンドバー → チャット or 指示パース（「西の書架へ」） | 簡易 intent → activity 予約 | FE / BE |
| HO-404 | Must | 毎日の質問マスタ + 回答 UI（5–6問） | `DailyQuestions.jsx` | FE |
| HO-405 | Must | 回答反映: `sync_rate` / vitals / 探索重み更新 | `apply-daily-answers` EF | BE |
| HO-406 | Could | 音声入力（Web Speech API） | チャット画面 | FE |

### Phase F — タイムライン・フレンド・ユーザー会話（Day 3）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-501 | Must | タイムライン画面（日別・過去遡り） | `TimelineScreen.jsx` | FE |
| HO-502 | Should | 出会ったクローン一覧 + 共通Topic | `FriendsScreen.jsx` | FE |
| HO-503 | Should | 「この人と話してみますか？」→ ユーザー間チャット | `user_chats` テーブル検討 | BE / FE |
| HO-504 | Should | フレンド追加・招待 | `friendships` | BE |
| HO-505 | Should | 性格シフト再設定 | オンボーディング編集モード | FE |
| HO-506 | Should | 行動タイプ（深掘り/拡散/社交/反転）→ ロケーション重み | `clone_profiles.exploration_mode` | BE |

### Phase G — インフラ・デモ・提出（Day 3）

| ID | 優先 | タスク | 成果物 | 担当目安 |
|----|------|--------|--------|----------|
| HO-601 | — | Vercel デプロイ + 環境変数 | README デモ URL | Infra |
| HO-602 | — | 発表用シナリオ doc（3分） | `project-docs/demo-script.md` | PM |
| HO-603 | — | スクリーンショット 2枚 | `docs/screenshot-*.png` | 全員 |
| HO-604 | Could | バッジ・ランキング（ローカル表示のみ可） | ゲーミフィケーション §18 | FE |
| HO-605 | Could | 複数ワールド切替 UI（データは1ワールドのみでも可） | 左ナビ | FE |

---

## 6. フロントコンポーネント構成（目標ツリー）

```
frontend/src/
├── App.jsx                 # ルート・認証・クローン有無判定
├── styles/
│   ├── tokens.js           # HO-002: モック CSS 変数
│   └── world.css           # glass / grid / timeline 等
├── screens/
│   ├── OnboardingScreen.jsx
│   ├── WorldScreen.jsx     # HO-003–207: ホーム（3D+オーバーレイ）
│   ├── TopicScreen.jsx
│   ├── ChatScreen.jsx
│   ├── InterestMapScreen.jsx
│   ├── NotesScreen.jsx
│   └── TimelineScreen.jsx
├── components/world/
│   ├── WorldLayout.jsx     # topbar / sidebar / right / command
│   ├── CloneCard.jsx
│   ├── VitalsBar.jsx
│   ├── NowCard.jsx
│   ├── ActivityTimeline.jsx
│   ├── CommandBar.jsx
│   └── CameraControls.jsx
└── world/                  # Three.js（index.html から移植）
    ├── LibraryScene.jsx
    ├── buildAvatar.js
    ├── waypoints.js
    └── minimap.js
```

---

## 7. デザイン仕様（モック準拠）

| トークン | 値 | 用途 |
|----------|-----|------|
| `--bg-0` | `#03040f` | 背景 |
| `--neon-cyan` | `#4ff5e7` | Mira アクセント |
| `--neon-violet` | `#a378ff` | ブランド |
| `--neon-pink` | `#ff6ec7` | Sage |
| `--neon-green` | `#74ffa8` | Echo |
| フォント | Inter + Noto Sans JP + JetBrains Mono | HUD・時刻 |

**アバター（Mira デフォルト）**: 紫×シアン、フード型、胸コア発光 — `PALETTES.mira` in `index.html`

**ロケーション slug（MVP）**

| slug | 表示名 | モック上のウェイポイント |
|------|--------|-------------------------|
| `central-desk` | 中央デスク | wp index 0, 5 |
| `east-shelf` | 東の書架 | wp index 1 |
| `skylight` | 天窓 / 観測所 | wp index 2 |
| `west-shelf` | 西の書架 | wp index 3 |
| `assembly` | 集会場 | 会話シーン（NPC 配置） |

---

## 8. 発表デモシナリオ（3分・推奨）

1. **オンボーディング** — ミサキ想定で Mira 作成、「少し外向的」選択  
2. **ホーム** — 3D で Mira が書架→デスクを巡回。Sage と吹き出し交差  
3. **今日のTopic** — 「カフェ巡り × フィルムカメラ」+ 理由（行動経路つき）  
4. **チャット** — 「なぜ興味を持ったの？」→ クローンが自分との関係を説明  
5. **毎日の質問** — 2問回答 → 同期率 99.6% → 99.8% など視覚的変化  
6. **タイムライン** — 「放置していた間にこう動いていた」一覧  
7. **クロージング** — コピー「あなたのクローンが、知らない自分を見つけてくる。」

---

## 9. リスクとカットライン

| リスク | 対策 | カット時 |
|--------|------|----------|
| Three.js 移植が重い | Day1 は `index.html` を iframe 埋め込みでも可 | 後から React 統合 |
| AI コスト / 遅延 | デモはシード JSON + 1回だけ LLM | 全ストリーミング |
| リアルタイム複雑 | ポーリング 5s で代替 | Realtime |
| 旧 Curio コード混在 | `frontend/src/screens/*` を段階削除 | ビルド通過優先 |
| ユーザー間マッチング | フレンドはデモ2アカウント固定 | HO-503 |

**Day3 最低ライン（Must のみ）**: HO-103,104,201,204–206,301–306,401–405,501 + モック級の 3D（HO-004）

---

## 10. 進捗チェック（手動更新）

> **次に着手するタスクの一覧は §0.4 を参照。**

### Phase A — Milestone A（デモ実装）
- [x] HO-001（README・プロダクト名の一部）
- [x] HO-002
- [ ] HO-003（`WorldScreen` 単体のまま — コンポーネント分割は未）
- [ ] HO-004（`initLibraryScene.js` 単一ファイル — 分割は未）
- [x] HO-005（Bloom オフ・フォールバックで運用）
- [x] HO-006（`three@0.128.0` のみ。R3F は未導入）

### Phase B — **← ここから優先**
- [ ] HO-101
- [ ] HO-102
- [x] HO-103（簡易版 `OnboardingModal` — 設計書フル項目は未）
- [ ] HO-104
- [x] HO-105（LocalStorage 版）

### Phase C
- [x] HO-201
- [x] HO-202
- [x] HO-203
- [x] HO-204（表示のみ・DB 未連携）
- [ ] HO-205（ダミー / 3D コールバックのみ）
- [ ] HO-206（初期ダミー固定）
- [x] HO-207（UI のみ・送信未接続）
- [x] HO-208

### Phase D
- [ ] HO-301
- [ ] HO-302
- [ ] HO-303
- [ ] HO-304
- [ ] HO-305
- [ ] HO-306
- [ ] HO-307

### Phase E
- [ ] HO-401
- [ ] HO-402
- [ ] HO-403
- [ ] HO-404
- [ ] HO-405
- [ ] HO-406

### Phase F
- [ ] HO-501
- [ ] HO-502
- [ ] HO-503
- [ ] HO-504
- [ ] HO-505
- [ ] HO-506

### Phase G
- [x] HO-601（`vercel.json`・ローカル build — **Production URL 記載は未**）
- [ ] HO-602
- [ ] HO-603
- [ ] HO-604
- [ ] HO-605

---

## 11. 関連ドキュメント

| ファイル | 用途 |
|----------|------|
| [rule.md](./rule.md) | ブランチ・PR・担当宣言 |
| [AI_USAGE_LOG.md](./AI_USAGE_LOG.md) | 審査用 AI 記録 |
| [../index.html](../index.html) | UI/3D モック（正） |
| [../README.md](../README.md) | セットアップ・提出 |

---

## 12. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-25 | 初版 — 放置me プロダクト設計書・index.html モックに基づく実装プラン |
| 2026-05-25 | Milestone A 完了を反映。§0.3 現在地・§0.4 ここから取り組むタスクを追加 |
