# Curio Meet 開発ルール（team-05）

ハッカソン 3 日間向けの最小ルール。迷ったら **plan.md のタスク ID** を基準にする。

---

## 0. 作業を始める前

- [ ] `main` を最新にする（ブランチを切る・作業再開のたび）

```bash
git checkout main
git pull origin main
```

- [ ] [plan.md](./plan.md) で担当タスク（`MVP-xxx`）を確認する
- [ ] **LINE で担当宣言**（下記テンプレ）してから着手する

```
【担当】MVP-301 reserve-experience
【担当者】@名前
【ブランチ】feat/mvp-301-reserve-experience
【目安】Day1 午後まで
```

同じタスクを二人で触らない。取り消すときも LINE で一声。

---

## 1. ブランチ

### 1.1 原則

- **1 タスク = 1 ブランチ**（`plan.md` のチェックボックス 1 行単位が目安）
- **`main` には直接 push しない**（緊急時のみ PM が判断）
- ブランチ名は **英小文字・ハイフン区切り**。可能なら **タスク ID を含める**

### 1.2 命名規則

```
<type>/<task-id>-<short-description>
```

| type | 用途 | 例 |
|------|------|-----|
| `feat` | 機能追加 | `feat/mvp-203-home-feed-supabase` |
| `fix` / `bugfix` | バグ修正 | `fix/mvp-302-reserve-double-submit` |
| `hotfix` | 本番デモ URL の緊急修正 | `hotfix/vercel-build-error` |
| `docs` | ドキュメント | `docs/mvp-006-readme-demo-url` |
| `refactor` | 挙動を変えない整理 | `refactor/extract-reserve-hook` |
| `test` | テスト | `test/mvp-301-reserve-function` |
| `style` | 見た目・整形のみ | `style/profile-tab-spacing` |
| `perf` | パフォーマンス | `perf/feed-scroll` |
| `chore` | 雑務・依存更新 | `chore/deps-vite` |
| `ci` | CI 設定 | `ci/github-actions-build` |
| `build` | ビルド設定 | `build/vercel-config` |
| `release` | リリース・提出準備 | `release/day3-submission` |

**front / back の区別**（任意・わかりやすければ使ってよい）:

- `feat/front-...` … 画面・コンポーネント
- `feat/back-...` … Supabase / Edge Functions / スキーマ

例: `feat/front-mvp-205-post-screen-db`

---

## 2. 実装・コミット

### 2.1 スコープ

- **担当タスクの範囲だけ**変更する（ついで修正は別 PR or 相談）
- 秘密情報（`.env`、API キー、Supabase サービスロールキー）は **コミットしない**
- AI を使った作業は [AI_USAGE_LOG.md](./AI_USAGE_LOG.md) に追記する（審査用）

### 2.2 コミットメッセージ（推奨）

```
<type>: <何をしたか> (MVP-xxx)
```

例:

```
feat: Home フィードを Supabase 取得に変更 (MVP-203)
fix: 二重予約を Edge Function で拒否 (MVP-303)
```

### 2.3 PR 前のセルフチェック

```bash
cd frontend
npm install   # 初回 or package.json 変更時
npm run build # エラーが出ないこと
```

ローカルで `npm run dev` し、担当画面の動作を最低 1 回確認する。

---

## 3. タスク完了時

1. [plan.md](./plan.md) の該当行を `- [x]` に更新する（**同じ PR に含めてよい**）
2. 担当ブランチに push
3. **Pull Request** を `main` 向けに作成
4. LINE で PR URL を共有（テンプレ下記）

### 3.1 PR タイトル

```
[MVP-203] feat: Home フィードを Supabase 連携
```

### 3.2 PR 本文（コピペ用）

```markdown
## タスク
- plan.md: MVP-xxx（チェック済み）

## 変更内容
- （箇条書き 2〜5 行）

## 確認方法
1. `npm run dev`
   実行場所: `frontend/`
2. （操作手順）

## スクリーンショット
- （UI 変更時は貼る）

## 補足
- 未対応・既知の問題があれば書く
```

---

## 4. レビュー・マージ

### 4.1 誰が見るか

| 種別 | 担当 |
|------|------|
| **人間レビュー** | 担当外のメンバー **1 名以上** Approve |
| **CodeRabbit** | あれば参考にする（指摘は対応 or 理由を PR にコメント） |
| **マージ** | Approve 後、**PR 作成者 or PM** が `main` へマージ |

ハッカソン中は「LGTM + ビルド通過」でマージしてよい。細かいデザイン差異は別タスクに回す。

### 4.2 マージ後

- LINE で「マージした」と一声
- 次の作業者は **必ず `main` を pull** してから新ブランチを切る
- デプロイ（Vercel）が走る場合は、デモ URL の動作を担当者が軽く確認

---

## 5. 連絡・エスカレーション（LINE）

### 5.1 すぐ共有すること

- **ブロッカー**（30 分以上進まない、設計判断が必要）
- **ビルド / CI / Vercel / Supabase が落ちた**
- **他人の担当ファイルを大きく変える必要がある**
- **`.env` やキーが必要**（チャットにキー本体は貼らない。1Password / 口頭 / 対面で）

### 5.2 テンプレ

**困ったとき**

```
【ブロッカー】MVP-301
【状況】Edge Function のデプロイで 403
【試したこと】ログ確認、キー再設定
【助けてほしいこと】Supabase 権限の確認
```

**PR 出したとき**

```
【PR】MVP-203 Home Supabase 連携
https://github.com/.../pull/xx
レビューお願いします
```

### 5.3 返信の目安

- 日中: **1 時間以内**にリアクション or 返信（見ただけでも OK）
- 深夜作業は任意。翌朝まとめて返信でよい

---

## 6. コンフリクト・衝突

- 同じファイルを触りそうなときは、着手前に LINE で相談
- `main` が進んだらこまめに取り込む:

```bash
git checkout <your-branch>
git fetch origin
git merge origin/main
# または git rebase origin/main（チームでどちらかに統一。迷ったら merge）
```

解消できなければペアで画面共有（10 分ルール）。

---

## 7. 役割の目安（参考）

| 役割 | 例 |
|------|-----|
| PM | タスク割当、PR 優先度、デモ URL、提出物 |
| FE | `frontend/src/`、Vercel、画面連携 |
| BE / Infra | Supabase、Edge Functions、RLS、シード |
| 全員 | plan.md 更新、AI ログ、レビュー |

詳細タスクは [plan.md](./plan.md) の「担当目安」列を参照。

---

## 8. やらないこと（ハッカソン版）

- `main` への force push（**禁止**）
- レビューなしの大量マージ
- plan.md にない大規模リファクタ（時間が余ったら相談）
- 秘密情報のコミット・スクショ共有

---

## 9. 関連ドキュメント

| ファイル | 用途 |
|----------|------|
| [plan.md](./plan.md) | タスク一覧・進捗チェック |
| [README.md](../README.md) | セットアップ・デモ URL・提出ステータス |
| [AI_USAGE_LOG.md](./AI_USAGE_LOG.md) | AI 活用の記録（審査用） |

---

## 10. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-05-24 | 初版 |
