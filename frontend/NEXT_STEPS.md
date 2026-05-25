# 放置me — 次のステップ：Claude API と Supabase の接続

このドキュメントは、ローカルMVPから本番化への移行手順です。
**段階的に進めること**（いきなり両方繋ぐと壊れた時に原因が分からなくなる）。

ローカルで storage と clone-engine は Interface で抽象化されているため、それぞれ最後に **1 行差し替えるだけ** で本番接続に切替できます。

---

## ステップA：Claude API を繋ぐ（モックLLMを置換）

### A-1. Anthropic API キーを取得

1. https://console.anthropic.com/ にアクセスしてサインアップ
2. **API Keys → Create Key**
3. キー（`sk-ant-...`）を安全に保存

### A-2. 環境変数の設定

プロジェクトルートに `.env.local` を作成：

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

`.gitignore` に `.env.local` が含まれていることを確認（Next.js のデフォルトで含まれます）。

### A-3. パッケージインストール

```bash
npm install @anthropic-ai/sdk
```

### A-4. API Route を作成（キーをブラウザに露出させない）

`/src/app/api/topics/generate/route.ts`：

```ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateTopicPrompt } from '@/lib/claude/prompts/generateTopic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { clone, history } = await req.json();
  const { system, user } = generateTopicPrompt(clone, history);

  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');

  // モデルが JSON で返す前提（プロンプトで指定）
  const json = JSON.parse(text);
  return NextResponse.json(json);
}
```

`/src/app/api/chat/route.ts`（SSE ストリーミング）：

```ts
import Anthropic from '@anthropic-ai/sdk';
import { chatPrompt } from '@/lib/claude/prompts/chat';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { clone, history, userText } = await req.json();
  const { system, messages } = chatPrompt(clone, history, userText);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
  });
}
```

### A-5. プロンプトの外出し

`/src/lib/claude/prompts/generateTopic.ts`：

```ts
import type { Clone, Topic } from '@/types';

export function generateTopicPrompt(clone: Clone, history: Topic[]) {
  const past = history.slice(0, 5).map((t) => `- ${t.title}`).join('\n') || '（なし）';
  return {
    system: `あなたはユーザー「${clone.name}」のクローンAIです。
仮想世界「叡智の図書館」での今日の探索を踏まえ、ユーザーがまだ気づいていない興味を発見する Topic を JSON で返してください。
出力は厳密に以下の JSON 形式のみ：
{"title":"...","reasoning":"...","explorationPath":["...","...","...","..."],"relatedConcepts":["...","...","..."]}`,
    user: `ユーザー情報:
- 名前: ${clone.name}
- MBTI: ${clone.mbti}
- 好きなもの: ${clone.likes.join('、')}
- 苦手: ${clone.dislikes.join('、')}
- 自己紹介: ${clone.selfDescription}
- なりたい自分: ${clone.idealSelf}
- 性格シフト: ${clone.personalityShift}
- 探索タイプ: ${clone.explorationType}

過去Topic（避ける）:
${past}

今日の Topic を生成してください。`,
  };
}
```

`/src/lib/claude/prompts/chat.ts`：

```ts
import type { Clone, Message } from '@/types';

export function chatPrompt(clone: Clone, history: Message[], userText: string) {
  const messages = history.slice(-12).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }));
  messages.push({ role: 'user', content: userText });
  return {
    system: `あなたはユーザー「${clone.name}」のクローンAI「${clone.name}」です。
口調は柔らかく、内省的。150字以内で1往復を返してください。
ユーザーの好きなものとの接点を必ずどこかで触れます。`,
    messages,
  };
}
```

### A-6. ClaudeApiImpl を追加

`/src/lib/clone-engine.ts` に追加：

```ts
export class ClaudeApiImpl implements CloneEngine {
  async generateTodaysTopic(clone, history) {
    const r = await fetch('/api/topics/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clone, history }),
    });
    if (!r.ok) throw new Error('topic generation failed');
    const json = await r.json();
    return {
      id: crypto.randomUUID(),
      dateKey: new Date().toISOString().slice(0, 10),
      title: json.title,
      reasoning: json.reasoning,
      explorationPath: json.explorationPath,
      relatedConcepts: json.relatedConcepts,
      createdAt: new Date().toISOString(),
    };
  }

  async *chatStream(clone, history, userText) {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clone, history, userText }),
    });
    if (!r.body) return;
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      yield dec.decode(value);
    }
  }
}
```

### A-7. 切り替え

`/src/lib/clone-engine.ts` の最終行を 1 行変更：

```diff
- export const engine: CloneEngine = new LLMMockImpl();
+ export const engine: CloneEngine = new ClaudeApiImpl();
```

### A-8. 動作確認

1. `npm run dev` を再起動
2. devtools の Application タブで `houchi-me/topics` をクリア
3. ホーム画面 → ノートタブで本物の Claude による Topic が表示されるはず
4. 対話タブで送信 → ストリーミングで応答

うまく行かないとき:
- Network タブで `/api/topics/generate` が 200 か
- サーバーログにエラーが出ていないか
- `ANTHROPIC_API_KEY` が読まれているか

---

## ステップB：Supabase を繋ぐ（localStorage を置換）

### B-1. Supabase プロジェクト作成

1. https://supabase.com/dashboard で New Project
2. **Project URL** と **anon key**、**service_role key** を控える

### B-2. 環境変数

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### B-3. パッケージ

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### B-4. スキーマ（Supabase SQL Editor）

```sql
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table clones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  mbti text,
  likes text[],
  dislikes text[],
  self_description text,
  ideal_self text,
  personality_shift text,
  exploration_type text,
  sync_rate numeric default 99.6,
  created_at timestamptz default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  clone_id uuid references clones(id) on delete cascade,
  date_key text not null,
  title text not null,
  reasoning text,
  exploration_path text[],
  related_concepts text[],
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  clone_id uuid references clones(id) on delete cascade,
  role text not null,
  text text not null,
  created_at timestamptz default now()
);

create table feedback (
  topic_id uuid primary key references topics(id) on delete cascade,
  kind text not null,
  created_at timestamptz default now()
);

alter table profiles  enable row level security;
alter table clones    enable row level security;
alter table topics    enable row level security;
alter table messages  enable row level security;
alter table feedback  enable row level security;

create policy "own profile"
  on profiles for all using (auth.uid() = id);

create policy "own clones"
  on clones for all using (auth.uid() = user_id);

create policy "own topics"
  on topics for all
  using (exists (select 1 from clones c where c.id = clone_id and c.user_id = auth.uid()));

create policy "own messages"
  on messages for all
  using (exists (select 1 from clones c where c.id = clone_id and c.user_id = auth.uid()));

create policy "own feedback"
  on feedback for all
  using (exists (select 1 from topics t join clones c on c.id = t.clone_id where t.id = topic_id and c.user_id = auth.uid()));
```

### B-5. クライアント

`/src/lib/supabase/client.ts`：

```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

`/src/lib/supabase/server.ts`：

```ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        ),
      },
    },
  );
}
```

### B-6. Magic Link 認証

`/src/app/(auth)/login/page.tsx`：

```tsx
'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const send = async () => {
    const sb = supabaseBrowser();
    await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setSent(true);
  };
  return sent ? <p>メールを確認してください</p> : (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={send}>Magic Link を送る</button>
    </div>
  );
}
```

`/src/app/auth/callback/route.ts`：

```ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (code) {
    const sb = await supabaseServer();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${url.origin}/`);
}
```

### B-7. SupabaseImpl

`/src/lib/storage.ts` に追加：

```ts
import { supabaseBrowser } from '@/lib/supabase/client';

export class SupabaseImpl implements Storage {
  private sb = supabaseBrowser();

  async getClone(): Promise<Clone | null> {
    const { data: { user } } = await this.sb.auth.getUser();
    if (!user) return null;
    const { data } = await this.sb.from('clones').select('*').eq('user_id', user.id).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      mbti: data.mbti,
      likes: data.likes ?? [],
      dislikes: data.dislikes ?? [],
      selfDescription: data.self_description ?? '',
      idealSelf: data.ideal_self ?? '',
      personalityShift: data.personality_shift,
      explorationType: data.exploration_type,
      syncRate: Number(data.sync_rate),
      createdAt: data.created_at,
    };
  }
  // 他のメソッドも同様に実装
  // ...
}
```

### B-8. localStorage からの移行

`/src/app/migrate/page.tsx`：

```tsx
'use client';
import { useState } from 'react';
import { LocalStorageImpl } from '@/lib/storage';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function MigratePage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    setRunning(true);
    const local = new LocalStorageImpl();
    const sb = supabaseBrowser();
    const clone = await local.getClone();
    const topics = await local.getTopics();
    const messages = await local.getMessages();
    const feedback = await local.getFeedback();
    const { data: { user } } = await sb.auth.getUser();
    if (!user || !clone) return setDone(true);

    const { data: cloneRow } = await sb.from('clones').insert({
      user_id: user.id,
      name: clone.name,
      mbti: clone.mbti,
      likes: clone.likes,
      dislikes: clone.dislikes,
      self_description: clone.selfDescription,
      ideal_self: clone.idealSelf,
      personality_shift: clone.personalityShift,
      exploration_type: clone.explorationType,
      sync_rate: clone.syncRate,
    }).select().single();

    if (cloneRow) {
      await sb.from('topics').insert(topics.map((t) => ({
        clone_id: cloneRow.id,
        date_key: t.dateKey,
        title: t.title,
        reasoning: t.reasoning,
        exploration_path: t.explorationPath,
        related_concepts: t.relatedConcepts,
      })));
      await sb.from('messages').insert(messages.map((m) => ({
        clone_id: cloneRow.id,
        role: m.role,
        text: m.text,
      })));
      await sb.from('feedback').insert(Object.values(feedback).map((f) => ({
        topic_id: f.topicId,
        kind: f.kind,
      })));
    }
    setDone(true);
  };

  return done ? <p>移行完了</p> : (
    <button disabled={running} onClick={run}>データを移行</button>
  );
}
```

### B-9. 切り替え

`/src/lib/storage.ts` の最終行を 1 行変更：

```diff
- export const storage: Storage = new LocalStorageImpl();
+ export const storage: Storage = new SupabaseImpl();
```

### B-10. 動作確認

1. `/login` で magic link → 受信メールのリンクをクリック
2. `/migrate` で既存データを Supabase に移行
3. リロード → DB 由来のデータが読まれる
4. 別ブラウザでログインしても同じデータが見える

---

## ステップC：Vercel にデプロイ

1. `git init && git add . && git commit -m "init"` で Git リポジトリ化
2. https://github.com/new で新規 repo 作成 → `git remote add origin ... && git push -u origin main`
3. https://vercel.com/new で repo を import
4. **Environment Variables** に以下を設定：
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy
6. Supabase の **Authentication → URL Configuration → Site URL** に Vercel ドメインを追加

---

## トラブルシューティング

- **CORS エラー** → Next.js の API Route 経由にする（ブラウザから直接 Anthropic を叩かない）
- **Magic link が届かない** → Supabase の SMTP 設定確認 / 迷惑メール
- **RLS で permission denied** → `auth.uid()` がセッションから取れているか確認、未ログイン状態のとき RLS で全部弾かれる
- **Claude API のレート制限** → `tier 1` だと低い。`messages.stream` 使用時は同時並行を1にしてエラー時リトライ
- **localStorage の `houchi-me/clone` だけ残って消えない** → devtools の Application → Clear site data
- **3D が重い** → `dpr={[1, 1.5]}` に下げる、`Bloom intensity` を下げる、`shadows` を off に
- **Topic が同じものばかり** → モックの場合は `MOCK_TOPIC_SEEDS` を増やす、API なら system に「過去Topic を避ける」と明示
- **Supabase の auth.users と profiles が紐づかない** → `on auth.user created` で profiles に insert するトリガを作る
- **next build で webpack エラー** → Next.js 16 の Turbopack デフォルトに対応。`next build --webpack` で旧挙動に戻せる

---

## 改善のヒント

- **モック Topic を増やす**：`src/lib/clone-engine.ts` の `MOCK_TOPIC_SEEDS` を編集するだけで即反映
- **プロンプトを調整**：`/src/lib/claude/prompts/` を編集して quality を上げていく
- **3D 世界の拡張**：`src/components/world/Library.tsx` に追加ロケーションを置く、`WorldScene.tsx` のウェイポイントを増やす
- **マルチワールド**：`palettes.ts` に Astrarium / Atelier03 を追加し、`NavTree` から切替できるように

Happy 放置.
