# Curio Meet 実装計画（plan.md）

> 作成日: 2026-05-24  
> 対象: `team-05/` ディレクトリ  
> 参照: プロダクト設計書（Curio Meet）、現行コードベース

---

## 1. サマリー

| 観点 | 現状 | 設計書の想定 |
|------|------|--------------|
| フロント | **React + Vite + Tailwind**（`curio-meet-mock`） | React Native / Expo Web |
| バックエンド | **なし**（`dummyData.js` + React `useState`） | Supabase（Auth / Postgres / Storage / Edge Functions） |
| デプロイ | **未設定** | Vercel（main 連携・QR デモ URL） |
| UI 完成度 | **MVP 画面の UI モックは概ね揃っている** | 審査員が触れる「動く MVP」 |

**結論**: 画面フローと TikTok 風 UX の**プロトタイプ**はできている。MVP として審査に耐えるには、**データ永続化・ビジネスロジック（ポイント／好奇心マップ）・デプロイ**が未着手の中心ギャップ。

### 1.1 ギャップ解消チェックリスト

- [ ] フロントを Vercel にデプロイしデモ URL を公開
- [ ] Supabase（DB / Auth / Storage）を接続
- [ ] 予約・ログ・ポイントを Edge Functions 経由に移行
- [ ] 好奇心マップをユーザー操作で更新可能にする

---

## 2. 現状実装マップ

### 2.1 ディレクトリ構成

```
team-05/
├── src/
│   ├── App.jsx                 # タブ遷移・予約/ログ/投稿の状態管理（ローカルのみ）
│   ├── data/dummyData.js       # 体験会・ユーザー・好奇心マップ等の静的データ
│   ├── screens/
│   │   ├── HomeScreen.jsx      # 縦スナップフィード + モーダル
│   │   ├── ProfileScreen.jsx   # プロフィール・マップ・予約・ログ・交換タブ
│   │   ├── PostScreen.jsx      # 体験会投稿フォーム
│   │   └── LogScreen.jsx       # 参加後ログ（オーバーレイ）
│   └── components/
│       ├── ExperienceCard.jsx  # フィードカード（TikTok 風 UI）
│       ├── ExperienceModal.jsx # 詳細 + 予約完了
│       ├── BottomTabBar.jsx    # Home / 投稿 / プロフィール
│       └── …（Button, Badge, StarRating, PointBurst）
├── package.json
└── README.md                   # ハッカソン用テンプレ（未記入多数）
```

### 2.2 画面別：設計書 vs 実装

- [x] **Home フィード**（縦型ショート動画風 UI）— 画像/動画ではなくジャンル別グラデ＋絵文字、`feed-snap` で縦スクロール
- [x] 体験会情報オーバーレイ（タイトル・場所・費用・pt 等）— `ExperienceCard` 左下キャプション + CTA
- [x] 詳細モーダル（Home 上で完結）— `ExperienceModal` ボトムシート
- [x] モーダル内予約（確認画面なしで完了）— ローカル `reservations` に追加
- [x] 予約完了表示（文言・+30pt 案内）— モーダル内 `completed` 状態
- [x] **プロフィール** UI（pt・称号・マップ・予約・ログ）
- [ ] プロフィール：好奇心マップの動的更新（現状は `dummyData.curiosityMap` 固定）
- [x] 称号・次の称号まで（表示のみ）
- [ ] 称号のログ連動による自動更新
- [x] 予約中一覧（プロフィール「予約中」タブ）
- [x] 参加済みログ一覧（「ログ」タブ、App 状態で保存）
- [x] 商品券交換イメージ（「近日公開」表示、実交換なし）
- [x] **体験会投稿** フォーム → Home 反映（`userPosts` マージ、画像はプレースホルダ）
- [x] **参加後ログ** UI（感想・星・次ジャンル・pt）
- [ ] 参加後ログ：保存後の好奇心マップ連動（ハードコード表示のみ）
- [ ] 保存ボタン（フィード）の永続化（カード内ブックマークはローカル UI のみ）
- [ ] フォロー中タブの実装（MVP 外・UI シェルのみ）
- [ ] 検索機能（ボタンのみ）

### 2.3 コアユーザーフロー（最短体験）

```
Home 閲覧 → 詳細モーダル → 予約 →（参加想定）→ プロフィールからログ → pt 表示
```

- [x] 1–4 閲覧・モーダル
- [x] 5 予約（同一セッション内）
- [ ] 5 予約の永続化（リロードで消える）
- [ ] 5 定員超過チェック
- [ ] 6–7 参加ステータス遷移（予約 → joined。現状はログで `completed` のみ）
- [x] 8 ログ投稿（同一セッション内）
- [ ] 8 好奇心マップ・ニッチ pt の連動
- [ ] 9 pt・マップ更新（pt は +30 固定、マップは画面文言のみ）

### 2.4 技術スタックの差分

- [x] フロント UI 実装（Vite React）
- [ ] フロント Vercel デプロイ（設計書: Expo Web も可、MVP は現スタック維持可）
- [ ] DB: Supabase Postgres + スキーマ + CRUD
- [ ] 認証: Supabase Auth（MVP は匿名 or 簡易ログイン）
- [ ] 重要処理: Edge Functions（現状 App.jsx 直書き）
- [ ] Storage: 画像アップロード
- [ ] デプロイ: Vercel main 連携

### 2.5 データモデル（設計書 §13）の充足度

- [ ] `users` — `id` / `createdAt`、DB 永続化
- [ ] `experiences` — `category` / `nicheScore` / `creatorId` / `mediaUrl` 整備
- [ ] `reservations` — `status`（reserved / joined / cancelled）
- [ ] `experience_logs` — `experienceId` / `nextInterestTags` 命名・DB 整合
- [ ] `curiosity_map_items` — ユーザー操作での更新
- [ ] `point_transactions` — 実装

---

## 3. MVP の定義（本 plan での境界）

設計書 **§7 MVP スコープ** と **§18 Must / Should** に沿い、ハッカソン 3 日間で「審査員が端末（ブラウザ）で一連の体験を完走できる」状態を MVP とする。

### 3.1 MVP に含める（Must + 審査デモに必要な Should）

- [ ] Home フィード → モーダル → **予約が DB に残る**
- [ ] 体験会投稿 → **Home に表示され他ユーザーからも見える**（同一 DB）
- [ ] 予約済み → プロフィール表示 → **参加後ログ** → **pt 加算**
- [ ] **好奇心マップがログ／参加に応じて更新される**（最低：該当ジャンルの Lv +1）
- [ ] **ポイント履歴**（簡易で可）と表示上の総 pt 一致
- [ ] **Vercel デプロイ** + README にデモ URL
- [ ] ダミーデータのシード（体験会供給リスク対策）

### 3.2 MVP に含めない（設計書 §7 MVP 外 / §18 Won't）

> スコープ外の確認用。実装したらチェックではなく、意図的に見送った印。

- [x] AI 翻訳 — 見送り
- [x] ランキング — 見送り
- [x] 実決済 — 見送り
- [x] 本人確認 — 見送り
- [x] チャット — 見送り
- [x] レビュー — 見送り
- [x] 通知 — 見送り
- [x] 高度なレコメンド — 見送り
- [x] 独立した体験会詳細ページ — 見送り
- [x] 予約確認専用画面 — 見送り
- [x] Random Box — 見送り（UI シェルは残して可）
- [x] Following タブの実装 — 見送り（UI シェルは残して可）
- [x] 商品券の実交換 — 見送り
- [x] 動画必須 — 見送り（画像で可）
- [x] Expo への全面移行 — 見送り（Post-MVP）

### 3.3 Should の MVP 内扱い

- [ ] 称号表示 + 閾値で自動更新（簡易ルール）
- [ ] ニッチ度ポイント（`nicheScore` に基づく加算、Edge Function）
- [ ] 予約中・参加済みログ表示の DB 連携
- [x] 商品券交換イメージ（現状 UI のまま、実交換なし）

### 3.4 Could は Post-MVP

- [ ] 保存機能の永続化
- [ ] 友達参加の pt ボーナス
- [ ] クリエイター詳細ページ
- [ ] フォロー中フィードの実装

---

## 4. タスク一覧

タスク ID は `MVP-xxx`（MVP）、`POST-xxx`（MVP 以降）で付与。  
**優先度**: P0（ブロッカー） / P1（MVP 必須） / P2（MVP 余力） / P3（Post-MVP）

---

### Phase 0: インフラ・基盤（MVP の前提）

- [ ] **MVP-001** — Supabase プロジェクト作成、環境変数（`.env` / Vercel）設定 `P0` `Infra`
- [x] **MVP-002** — DB スキーマ作成（§13: users, experiences, reservations, experience_logs, curiosity_map_items, point_transactions） `P0` `BE`
- [x] **MVP-003** — RLS ポリシー草案（読み取り公開、書き込みは本人 or Edge Function 経由） `P0` `BE`
- [ ] **MVP-004** — シードデータ投入（体験会 5 件以上、デモユーザー） `P1` `BE`
- [ ] **MVP-005** — Vercel プロジェクト連携、`npm run build`、main 自動デプロイ `P0` `Infra`
- [ ] **MVP-006** — README 更新（デモ URL・技術スタック・既知の問題）※ plan 外ファイルだが提出必須 `P1` `PM`

---

### Phase 1: 認証・ユーザー（MVP）

- [ ] **MVP-101** — Supabase Auth 導入（匿名ログイン or メールなしデモ用 1 アカウント） `P1` `BE`
- [ ] **MVP-102** — `users` 行の作成・取得（プロフィール: name, avatar, points, title） `P1` `BE / FE`
- [ ] **MVP-103** — フロント: `dummyData.initialUser` を API 取得に置き換え `P1` `FE`

---

### Phase 2: 体験会・フィード（MVP Must）

- [ ] **MVP-201** — `experiences` CRUD API（一覧・詳細。作成は認証ユーザー） `P0` `BE`
- [ ] **MVP-202** — 体験に `category`（好奇心クラスタ）と `nicheScore` を付与 `P1` `BE`
- [ ] **MVP-203** — Home: `experiences` を Supabase から取得してフィード表示 `P0` `FE`
- [ ] **MVP-204** — 体験カバー画像: Storage アップロード + `mediaUrl` 表示（未設定時は現行グラデ fallback） `P1` `FE / Infra`
- [ ] **MVP-205** — 投稿画面: フォーム送信 → DB insert → Home 先頭表示 `P0` `FE`
- [ ] **MVP-206** — 投稿時 `pointReward` 算出（ニッチ度 or デフォルト 100） `P2` `BE`

**現状ですでにできていること（追加実装不要）**

- [x] 縦スナップ UI、`ExperienceCard` / `ExperienceModal` のインタラクション
- [x] モーダル内予約完了 UI

---

### Phase 3: 予約（MVP Must）

- [ ] **MVP-301** — Edge Function `reserve-experience`（定員チェック、`reserved_count` 更新、reservation insert） `P0` `BE`
- [ ] **MVP-302** — フロント: `handleReserve` を Function 呼び出しに変更 `P0` `FE`
- [ ] **MVP-303** — 二重予約防止（同一 user + experience） `P1` `BE`
- [ ] **MVP-304** — プロフィール「予約中」タブを DB の `status=reserved` で表示 `P1` `FE`

**現状ギャップ**

- [ ] `App.jsx` のローカル配列から DB 連携へ移行
- [ ] 投稿後の `reservedCount` 増加

---

### Phase 4: 参加後ログ・ポイント・好奇心マップ（MVP Must / Should）

- [ ] **MVP-401** — Edge Function `submit-experience-log`（ログ保存、pt 加算、マップ更新、reservation→joined） `P0` `BE`
- [ ] **MVP-402** — ポイントルール実装（最低限: ログ +30、体験 `pointReward`、新ジャンル +150 は簡易判定） `P1` `BE`
- [ ] **MVP-403** — `point_transactions` 記録とプロフィール総 pt 同期 `P1` `BE`
- [ ] **MVP-404** — `curiosity_map_items` の upsert（genre + category、level / experience_count） `P0` `BE`
- [ ] **MVP-405** — フロント: ログ保存後の完了画面を**実際の更新結果**で表示（ハードコード削除） `P1` `FE`
- [ ] **MVP-406** — プロフィール好奇心マップタブを DB 連携 `P0` `FE`
- [ ] **MVP-407** — 称号: pt 閾値テーブル + `users.title` 更新 `P2` `BE / FE`
- [ ] **MVP-408** — 参加数・初体験ジャンル数の集計表示 `P2` `FE`

**現状ギャップ**

- [ ] `LogScreen` 完了メッセージの動的化（現状常に「陶芸 Lv.1」）
- [ ] `curiosityMap` の `dummyData` 固定解除

---

### Phase 5: プロフィール・交換 UI（MVP Should）

- [ ] **MVP-501** — 参加済みログ一覧を `experience_logs` から取得 `P1` `FE`
- [ ] **MVP-502** — ログカードに `againRating` 表示（現状 `funRating` のみ Stars） `P2` `FE`
- [ ] **MVP-503** — 交換タブ: 「実交換不可」の注記を設計書通り明確化（500pt 等はイメージ） `P2` `FE / Design`

**現状ですでにできていること**

- [x] タブ UI、pt・称号・進捗バー、交換リストの見た目

---

### Phase 6: デモ品質・審査向け（MVP）

- [ ] **MVP-601** — モバイル Web 表示調整（`device-frame`、safe-area、実機 Safari 確認） `P1` `FE`
- [ ] **MVP-602** — ローディング・エラー UI（予約失敗、定員満了） `P1` `FE`
- [ ] **MVP-603** — QR コード用デモ URL 固定・スクリーンショット撮影 `P1` `PM`
- [ ] **MVP-604** — 既知の問題 / 未実装を README に記載 `P1` `PM`
- [ ] **MVP-605** — AI_USAGE_LOG 追記（開発節目ごと） `P1` `全員`

---

## 5. MVP 以降（Post-MVP）

### 5.1 プロダクト機能拡張

- [ ] **POST-001** — 体験会動画アップロード・再生 `P3` — Storage + フィード内 `<video>`
- [ ] **POST-002** — 保存（ブックマーク）の永続化 `P3` — saved_experiences テーブル
- [ ] **POST-003** — Following フィード `P3` — フォロー関係 + フィルタ
- [ ] **POST-004** — Random Box `P3` — 設計書 Could
- [ ] **POST-005** — 予約キャンセル `P3` — status `cancelled`
- [ ] **POST-006** — 参加ステータス手動／QR チェックイン `P3` — 運用フロー次第
- [ ] **POST-007** — レビュー・通報・本人確認 `P3` — §17 リスク4 対策
- [ ] **POST-008** — 通知（予約リマインド） `P3` — Push / メール
- [ ] **POST-009** — ランキング・レコメンド `P3` — MVP 外
- [ ] **POST-010** — 実決済（Stripe 等） `P3` — 手数料モデル §16
- [ ] **POST-011** — 商品券実交換 `P3` — ポイント消費
- [ ] **POST-012** — AI 翻訳説明文 `P3` — MVP 外
- [ ] **POST-013** — クリエイター向け分析ダッシュボード `P3` — サブスク構想 §16

### 5.2 技術・インフラ

- [ ] **POST-101** — React Native / Expo への移行 or 共有ロジック化 `P3` — 設計書準拠のネイティブ体験
- [ ] **POST-102** — 分析イベント送信（§15 KPI） `P2` — Modal Open / Reserve / Log 等
- [ ] **POST-103** — Preview Deploy（PR ごと） `P2` — Vercel
- [ ] **POST-104** — AWS / Cloudflare 検討 `P3` — 大規模配信時

---

## 6. 実装優先順位（推奨スプリント）

### Day 1（基盤 + デモ導線）

- [ ] MVP-001〜005（Supabase + Vercel）
- [ ] MVP-002, MVP-004（スキーマ + シード）
- [ ] MVP-201, MVP-203（フィード DB 化）
- [ ] MVP-301, MVP-302（予約 Function）

**ゴール**: デプロイ URL で「他人の体験を見て予約まで」

### Day 2（価値の核）

- [ ] MVP-401〜406（ログ + pt + 好奇心マップ）
- [ ] MVP-205（投稿 → フィード）
- [ ] MVP-101〜103（最低限のユーザー）
- [ ] MVP-601, MVP-602

**ゴール**: 「投稿 → 予約 → ログ → マップ成長」が審査員に説明できる

### Day 3（仕上げ + 提出）

- [ ] MVP-407, MVP-501〜503（Should 消化）
- [ ] MVP-603〜605（README、スクショ、AI ログ）
- [ ] 余力: MVP-204（画像）、MVP-206

**ゴール**: プレゼン用デモシナリオが 3 分で回る

---

## 7. デモシナリオ（審査用チェックリスト）

審査員に見せる最短シナリオ。MVP 完了の受け入れ条件とする。

- [ ] QR / URL からスマホブラウザで起動
- [ ] Home で未知の体験をスワイプ閲覧
- [ ] 「予約する」→ モーダルで詳細確認 → 予約完了
- [ ] プロフィールで予約中が表示される
- [ ] 「参加後ログを書く」→ 感想・星評価 → 保存
- [ ] +pt 表示、好奇心マップの該当ジャンルが更新
- [ ] 投稿タブから新規体験会を作成 → Home に出現
- [ ] リロード後も予約・ログ・pt が維持される

---

## 8. リスクと現状の対策状況

- [ ] **体験会供給不足** — ダミー + C2C 投稿で対策（現状: ダミー 5 件 + ローカル投稿のみ）
- [x] **参加ハードル** — 初回無料・モーダル予約（UI 実装済み）
- [ ] **ポイント目当て参加** — マップ・ログで内発化（マップ更新が未連動）
- [x] **C2C 安全性** — 本人確認等は MVP 外（想定通り未着手）

---

## 9. 付録：コンポーネント ↔ 設計書画面

| 設計書 | ファイル |
|--------|----------|
| §9.1 Home | `HomeScreen.jsx`, `ExperienceCard.jsx` |
| §9.2 詳細モーダル | `ExperienceModal.jsx` |
| §9.3 プロフィール | `ProfileScreen.jsx` |
| §9.4 体験会投稿 | `PostScreen.jsx` |
| §9.5 参加後ログ | `LogScreen.jsx` |
| ナビゲーション | `BottomTabBar.jsx`, `App.jsx` |

---

## 10. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-24 | 初版作成（現行コードベース調査 + 設計書照合） |
| 2026-05-24 | タスク・追跡項目をチェックボックス形式に統一 |
