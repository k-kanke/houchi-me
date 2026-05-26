# 技術アピールポイント & 将来構想

---

## 1. 現在の技術アピールポイント

### 1-1. Redis によるセッション管理（DBアクセス最適化）

会話の開始・中間・終了でアクセス先を使い分けている。

```
start → DB（過去サマリ取得）→ Redis にセッション保存
turn  → Redis のみ（会話履歴の読み書き）
end   → Redis → DB に保存 → Redis キー削除
```

- 会話中のDBアクセスをゼロにすることでレイテンシを下げている
- TTL 30分で自動クリーンアップ（ストレージ節約）
- Upstash Redis（REST API）を使用 → Next.js Edge ランタイムでも動作

---

### 1-2. SSE でリアルタイム二段階ストリーミング

`ReadableStream` + `text/event-stream` による Server-Sent Events。

1ターンに LLM を**2回呼ぶ**設計：

```
Phase 1: クローン側の返答を生成 → ストリーム送信（phase: 'clone'）
Phase 2: 野良アバター側の返答を生成 → ストリーム送信（phase: 'wild'）
```

クライアントは2フェーズをリアルタイムで受け取り、順番に吹き出し表示できる。

---

### 1-3. ロール反転トリックで1つのLLMが両者を演じる

Gemini はhistoryの role を `user` / `model` で管理する制約がある。  
クローン視点の返答を生成するとき、**historyのロールをまるごと反転**（`model↔user`）させることで、同一モデルに別人格として返答させている。

```
通常の history:    model（野良）→ user（クローン）→ model（野良）...
クローン生成時:    user（野良）→ model（クローン）→ user（野良）...  ← ロール反転
```

追加の fine-tuning や別モデルなしに2キャラクターの対話を実現。

---

### 1-4. 会話でクローンの人格が成長する

エンカウント終了時に Gemini が会話ログを解析し、構造化JSONを生成する。

```json
{
  "resonated": ["相手が反応していたと感じたこと（最大3つ）"],
  "newInterests": ["初めて興味を示したキーワード（最大3つ）"],
  "selfDiscovery": "この会話を通じて気づいたこと（1文）",
  "hobbyDiscoveries": ["明らかに食いついたもの（最大2つ）"]
}
```

`hobbyDiscoveries` は確信度基準で厳しく判定し、確信が持てれば clone の `likes` に追記。  
→ **会話するたびにクローンの興味が実際に広がっていく。**

---

### 1-5. 3層コンテキストビルディング

LLM に渡すプロンプトは毎回3層で構築される。

```
Layer 1: クローンプロフィール（MBTI, likes, dislikes, 自己紹介, 探索タイプ）
Layer 2: 直近7件のトピック履歴（その日クローンが探索した内容）
Layer 3: 過去エンカウントの記憶（resonated, newInterests, selfDiscovery）
```

過去の会話を「記憶」として持った状態で次の会話が始まる。

---

### 1-6. Fallback パターン（デモ耐性）

```
SupabaseEdgeFunctionImpl（本番）
    ↓ 失敗時
LLMMockImpl（モック）
```

Strategy パターンで実装。Supabase / Gemini が落ちても、もしくは未設定でもモックエンジンに自動フォールバック。ネットワーク環境に依存せずデモが動く。

---

### 1-7. 3D バーチャルワールド（React Three Fiber）

- **自動巡回モード**: ウェイポイント間を lerp で補間移動
- **手動モード**: タンク式操作（前後移動 + 左右旋回）
- **エンカウント時**: 相手アバターが物理的に Mira に近づいてくる（lerp アニメーション）
- **カメラ**: 三人称追従カメラ / OrbitControls を状況に応じて切り替え
- **ポストプロセス**: Bloom + Vignette でサイバースペース的な雰囲気を演出

---

### 1-8. クローンの好みでワールドが変わる

```ts
const activeRooms = getActiveRooms(clone.likes)
```

ユーザーの `likes` にマッチした部屋だけワールドに出現する。  
趣味が違う人は見えるワールドが違う。世界がパーソナライズされている。

---

## 2. 技術的展望：階層記憶アーキテクチャ

### 2-1. 現状の課題

現在の `buildContext` は直近の情報しか持てない。

```
現状の3層
├── クローンプロフィール（静的）
├── 直近7件のトピック（タイトルのみ）
└── 直近5件のエンカウントsummary（LIMIT 5で切れる）
```

**欠けているもの**: 中長期の「この人はずっとこういう人だ」という記憶。  
古いエンカウントは LIMIT 5 で切り捨てられ、それ以前の記憶は消える。

---

### 2-2. 記憶の階層構造

記憶は時間とともに「古くなるほど遠くへ」という階層を持つ。

| 層 | ストレージ | 期間 | 内容 |
|---|---|---|---|
| **Working Memory** | Redis (TTL 30m) | 現セッション | 会話ターン履歴 |
| **Episodic Memory** | DB | 〜90日 | encounter summary, topics, daily answers |
| **Semantic Memory** | S3 + memory_index | 90日〜 | 圧縮・アーカイブ済み記憶 |
| **Procedural Memory** | DB（永続） | 永続 | likes/dislikes（会話で書き換わる人格） |

人間の記憶モデルに対応している：
- Working = 作業記憶（すぐ消える）
- Episodic = エピソード記憶（最近の出来事）
- Semantic = 意味記憶（一般化された知識）
- Procedural = 手続き記憶（習慣・性格）

---

### 2-3. アーカイブフロー（Warm → Cold）

```
flowchart TD
    START[memory-archival / バックグラウンドジョブ]

    START --> A[90日以上アクセスなし検出]
    A --> B[S3 に転送]
    B --> C[memory_index のみ残す]
    C --> D[topics[] / s3_key を保持]
```

`memory_index` はDB上に残ることで「どんな記憶があるか」は検索できる。  
実体（全文）は S3 にあるため、DBは軽量なまま。

---

### 2-4. memory_index スキーマ案

```sql
create table memory_index (
  id               uuid primary key,
  clone_id         uuid references clones,
  topics           text[],         -- キーワード群（検索に使う）
  s3_key           text,           -- null = まだDB上にある（Warm）
  source_type      text,           -- 'encounter' | 'topic' | 'daily'
  source_id        uuid,
  summary_snippet  text,           -- ランキング用の短い抜粋
  last_accessed_at timestamptz,    -- アーカイブ判定・昇格更新に使う
  created_at       timestamptz
);
```

---

### 2-5. 非同期サイクル（Cold → Warm 昇格）

「会話が記憶を呼び覚ます」という人間らしい挙動。

```
会話 start 時（同期）:
  1. Warm Layer から直近5件 → コンテキスト注入（現状）

会話 turn 時（非同期・バックグラウンド）:
  2. 現ターンの発言キーワードを抽出
  3. memory_index.topics[] とオーバーラップ検索
  4. スコアが高い archived 記憶を S3 から fetch
  5. encounter_logs に一時昇格（last_accessed_at 更新）

次ターン以降:
  6. Warm Layer として次の start で自動的に拾われる
```

現在の話題と関連した過去の記憶が浮かび上がってくる。

---

### 2-6. 将来のコンテキスト構造（5層）

```
buildContext() の将来形
├── Layer 0: Procedural Memory（永続・クローンプロフィール）
├── Layer 1: Episodic Memory - Hot（直近5件のエンカウントsummary）
├── Layer 2: Episodic Memory - Warm（中期トピック + reasoning）
├── Layer 3: Semantic Memory（昇格された長期記憶スニペット）← 新規
└── Layer 4: Working Memory（現セッションの流れ）
```

Layer 3 は非同期で差し替わるため、**会話が進むほどコンテキストが「記憶を思い出した状態」に近づいていく。**

---

### 2-7. 実装ロードマップ

段階的に進められる。

| フェーズ | 内容 | 難易度 |
|---|---|---|
| **Phase 1** | topics の reasoning も buildContext に含める | 低 |
| **Phase 2** | memory_index テーブル作成、バックグラウンドアーカイブ実装 | 中 |
| **Phase 3** | 非同期キーワードマッチによる Cold→Warm 昇格 | 中〜高 |
| **Phase 4** | S3 への実際のオフロード | 高 |

Phase 1 だけでもコンテキストの質は上がる。
Phase 3 以降が「会話が記憶を呼び覚ます」体験の核心。

---

## 3. まとめ

| 観点 | 現状 | 将来 |
|---|---|---|
| セッション | Redis TTL管理 | 変わらず（Working Memory） |
| 短期記憶 | encounter summary 直近5件 | Episodic Hot Layer |
| 中期記憶 | topic タイトルのみ | Episodic Warm + reasoning |
| 長期記憶 | **なし** | Semantic Memory（S3 + index） |
| 記憶の呼び起こし | **なし** | 非同期トピックマッチで昇格 |
| 人格の進化 | likes への書き込み | Procedural Memory として永続 |
