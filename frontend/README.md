# 放置me — Houchi me (Local MVP)

> あなたのクローンが、知らない自分を見つけてくる。
> 放置しておくほど、あなたが広がる。

クローンAI × 3D仮想世界「叡智の図書館（Sapientia）」の **ローカル限定MVP** です。
データ永続化は localStorage、LLMはモック実装。後で Supabase / Claude API に切り替える前提で、Interface で抽象化されています。

## 起動

```bash
npm install   # 初回のみ
npm run dev
```

ブラウザで http://localhost:3000 を開きます。
初回は `/onboarding` に自動遷移し、6ステップでクローンを作成すると `/` のメイン画面（叡智の図書館）に戻ります。

## 動く機能（v0.1）

- **クローン作成オンボーディング**（6ステップ・名前 / MBTI / 好み / 自己紹介 / 性格シフト / 探索タイプ）
- **起動ローダー**（CLONE OS のブートシーケンス再現）
- **3D 仮想世界**（叡智の図書館 / Mira・Sage・Echo の3クローン / 5ロケーション巡回 / 吹き出しによる会話）
- **4種カメラモード**（追従 / 軌道 / 俯瞰 / シネマ）
- **ミニマップ**（Canvas でリアルタイム描画 / 発話者リング）
- **今日のTopic**（モックLLMが日替わりで生成 / 行動経路と関連概念）
- **フィードバック**（気になる / 違う / もっと知りたい → syncRate 連動）
- **クローンチャット**（ストリーミング表示の文字入力 / 提案チップ）
- **左サイドバー**（クローン状態 / Vitals 3バー / NavTree / MiniMap）
- **右パネル**（NowCard / 今日のタイムライン / 直近7日の Stats）
- **上部 HUD**（座標 / 時刻 / パンくず / タブ切替）
- **下部コマンドバー**（クローンへの自然言語指示 / クイックアクション）

## ディレクトリ構造

```
src/
├ app/
│  ├ layout.tsx          — ルートレイアウト（フォント・メタデータ）
│  ├ globals.css         — Tailwind v4 + neon カラー + アニメーション
│  ├ page.tsx            — トップ。ローダー → AppShell（クローン未作成なら /onboarding へ）
│  └ onboarding/page.tsx — 6ステップのクローン作成
├ components/
│  ├ Loader.tsx
│  ├ layout/             — AppShell / TopBar / Sidebar / RightPanel / CommandBar
│  ├ sidebar/            — CloneStatusCard / Vitals / NavTree / MiniMap
│  ├ panel/              — NowCard / Timeline / Stats
│  ├ main/               — Breadcrumb / ViewTabs / HudCoord / CameraButtons / ActivityBadge / WorldStats
│  ├ topic/TodayTopicView.tsx
│  ├ chat/ChatView.tsx
│  └ world/              — VirtualWorld / WorldScene / Library / Avatar / Particles / CameraRig / palettes
├ lib/
│  ├ storage.ts          — Storage インタフェース + LocalStorageImpl
│  ├ clone-engine.ts     — CloneEngine インタフェース + LLMMockImpl
│  ├ store.ts            — Zustand のグローバル状態
│  └ util.ts
└ types/index.ts
```

## 抽象化の設計

```ts
// src/lib/storage.ts
export const storage: Storage = new LocalStorageImpl();
// ← この 1 行を SupabaseImpl に変えれば DB 永続化に切替

// src/lib/clone-engine.ts
export const engine: CloneEngine = new LLMMockImpl();
// ← この 1 行を ClaudeApiImpl に変えれば本物の Claude が返答
```

## 操作のヒント

- ヘッダー右のタブで **ノート / ワールド / 対話** を切替
- 「ワールド」では左に カメラ4種、ミニマップ（左サイドバー下）に3アバターの位置と発話者リングが出ます
- 「ノート」で Topic にフィードバックを押すと右パネル Stats と Vitals が即時更新
- リロードしても localStorage で永続化、`localStorage.clear()` でやり直し

## 次のステップ

本番化（Claude API / Supabase / Vercel）への移行手順は [NEXT_STEPS.md](./NEXT_STEPS.md) を参照してください。

## 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4（`@theme inline` でカラー & フォントトークン）
- Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- Zustand（グローバル状態管理）
- Inter / JetBrains Mono / Noto Sans JP（next/font/google）
