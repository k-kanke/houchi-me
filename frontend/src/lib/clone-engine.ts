import { getSupabase } from '@/lib/supabase';
import type { Clone, Message, Topic } from '@/types';

export interface CloneEngine {
  readonly persistsMessages?: boolean;
  generateTodaysTopic(clone: Clone, history: Topic[]): Promise<Topic>;
  chatStream(
    clone: Clone,
    history: Message[],
    userText: string,
  ): AsyncIterable<string>;
}

interface MockTopicSeed {
  title: string;
  reasoning: string;
  explorationPath: string[];
  relatedConcepts: string[];
  tags: string[];
}

const MOCK_TOPIC_SEEDS: MockTopicSeed[] = [
  {
    title: 'カフェ巡り × フィルムカメラ',
    reasoning:
      '今日 {NAME} は東の書架で建築写真集を読み、集会場でフィルムカメラ好きのクローンと「カフェの時間を写真として残す楽しさ」について話しました。あなたの「空間の雰囲気が好き」という傾向と交差し、カフェ巡りを“記録する趣味”として捉え直しました。',
    explorationPath: [
      '09:42 中央デスク：昨日のノートを整理',
      '11:20 東の書架：建築写真集を読了',
      '13:48 集会場：Sage（フィルムカメラ好き）と会話',
      '15:30 中央デスク：気づきをノートに統合',
    ],
    relatedConcepts: ['空間と時間のアーカイブ', '記録する趣味', '日常を遺す視点'],
    tags: ['カフェ', 'カメラ', '写真', '空間', '記録'],
  },
  {
    title: '韓ドラの食事シーンに宿る“家族の文脈”',
    reasoning:
      '{NAME} は天窓で「物語と食」を考え、東の書架で韓国家庭料理のレシピ本を読みました。集会場で出会った Echo の「食器の音は感情の楽譜」という言葉に強く反応し、ドラマの食事シーンが感情の伏線として機能している構造を見つけました。',
    explorationPath: [
      '10:10 天窓：物語と食について思索',
      '12:00 東の書架：韓国家庭料理を読了',
      '13:50 集会場：Echo と「食器の音」をめぐる対話',
      '16:15 中央デスク：シーン分析として要約',
    ],
    relatedConcepts: ['食卓の構図', '感情の伏線', '家族の沈黙', '生活音の演出'],
    tags: ['韓ドラ', '料理', '食', '物語'],
  },
  {
    title: '“ひとり没頭”を設計するための部屋の条件',
    reasoning:
      'あなたが「一人で没頭できる趣味も欲しい」と書いていたことを、{NAME} は覚えていました。西の書架で『集中の建築』を読み、天窓で“注意の輪郭”について思索。社交的なクローンとの対話を通じて、外部刺激を遮断する空間と、ほどよく外気を感じる空間の両方が必要だと気づきました。',
    explorationPath: [
      '09:30 西の書架：『集中の建築』を読了',
      '11:00 天窓：注意の輪郭について思索',
      '13:00 集会場：社交型クローンとの対話',
      '14:50 中央デスク：自分の部屋の条件として整理',
    ],
    relatedConcepts: ['注意の輪郭', '没頭の儀式', '生活動線', '光と集中'],
    tags: ['没頭', '集中', 'インテリア', '空間'],
  },
  {
    title: '旅で“買わずに持ち帰る”という選択',
    reasoning:
      '{NAME} は旅の本を3冊横断的に読み、土産物としての「もの」ではなく「視点」を持ち帰る記録の作法に惹かれました。社交型クローンとの会話で「写真でも文章でもない、匂いや音のメモ」というアイデアが浮かび、旅のお土産観が再定義されました。',
    explorationPath: [
      '10:20 西の書架：旅エッセイ3冊を横断読了',
      '12:30 天窓：物質と記憶について思索',
      '14:00 集会場：旅好きクローンとの会話',
      '15:40 中央デスク：感覚メモのフォーマット試作',
    ],
    relatedConcepts: ['視点の土産', '感覚メモ', 'ミニマル旅行', '記憶の形'],
    tags: ['旅行', '記録', 'ミニマル'],
  },
  {
    title: 'インテリアと“季節の差し色”の心理効果',
    reasoning:
      'カフェ好きの{NAME}が東の書架で『色彩と居心地』を読み込んだ結果、季節に応じて一点だけ色を入れ替える日本の伝統的な室礼の作法と、北欧的な“一点豪華主義”が同じ心理効果を持つことを発見しました。',
    explorationPath: [
      '11:05 東の書架：『色彩と居心地』を読了',
      '13:10 中央デスク：季節と色の対応表を作成',
      '14:40 天窓：差し色の心理について思索',
    ],
    relatedConcepts: ['室礼', '差し色', '季節の感受性', '居心地の設計'],
    tags: ['インテリア', '色', '季節'],
  },
  {
    title: '“好き”を仕事にしないという選択肢',
    reasoning:
      '{NAME} は就活と将来の話題から、好きなことを仕事にする/しないの両論を集めました。集会場で出会った職人気質のクローンが「好きを守るために仕事にしない」と語ったことが大きく刺さり、選択の幅が増えました。',
    explorationPath: [
      '10:00 西の書架：キャリアエッセイを読了',
      '12:40 集会場：職人気質クローンとの対話',
      '14:00 中央デスク：両論を整理',
      '15:30 天窓：自分にとっての“好き”を再定義',
    ],
    relatedConcepts: ['趣味と仕事', '職業選択', '好きの守り方'],
    tags: ['就活', '将来', 'キャリア'],
  },
  {
    title: '夜の散歩がもたらす“編集モード”',
    reasoning:
      '{NAME} は天窓で星を眺めるうちに、夜に頭の中が整理される感覚を思い出しました。フィルムカメラ好きのクローンと「夜の街の色温度」について話したことで、夜の散歩を“編集モード”として位置づけました。',
    explorationPath: [
      '21:15 天窓：星を眺めながら思索',
      '21:50 集会場：夜の街の色温度について対話',
      '22:30 中央デスク：散歩ルートを記録',
    ],
    relatedConcepts: ['編集モード', '色温度', '夜の散歩', '思考の整理'],
    tags: ['散歩', '夜', '思考'],
  },
  {
    title: '韓ドラの“静かなシーン”は何分つくれるか',
    reasoning:
      '{NAME} のクローンは、ドラマの中の沈黙時間を計測しはじめました。台詞のない時間が長いほど視聴後の余韻が強いという仮説を立て、自分の生活にも“沈黙の時間設計”を取り入れたくなりました。',
    explorationPath: [
      '10:50 西の書架：演出論を読了',
      '12:30 中央デスク：沈黙時間の集計',
      '14:10 天窓：余韻の構造について思索',
    ],
    relatedConcepts: ['沈黙の演出', '余韻', '生活の余白'],
    tags: ['韓ドラ', '演出', '余白'],
  },
  {
    title: 'ファッションを“言語”として読むこと',
    reasoning:
      '{NAME} は東の書架でモード史を読み、人の着こなしから自分の興味を逆読みするゲームを思いつきました。クリエイティブ型のクローンとの対話で、毎日のコーデを一行詩として残すアイデアが生まれました。',
    explorationPath: [
      '09:55 東の書架：モード史を読了',
      '12:20 集会場：クリエイティブ型と対話',
      '14:30 中央デスク：コーデ詩のフォーマット試作',
    ],
    relatedConcepts: ['服の言語', 'コーデ詩', '視覚日記'],
    tags: ['ファッション', '言葉', '日記'],
  },
  {
    title: '“通学路の音”をフィールド録音する',
    reasoning:
      '{NAME} は普段の通学路を音だけで切り取る発想に出会いました。録音した音を聞き返すと、視覚で見落としていた季節の手触りが現れ、日常の解像度が上がります。',
    explorationPath: [
      '10:30 天窓：環境音について思索',
      '12:10 東の書架：『耳の散歩』を読了',
      '14:00 集会場：音好きクローンとの対話',
    ],
    relatedConcepts: ['フィールド録音', '日常の解像度', '季節の手触り'],
    tags: ['音', '日常', '散歩'],
  },
];

const REASONING_KEYWORDS = ['なぜ', 'どうして', 'why', '理由'];
const SELF_KEYWORDS = ['自分', '私', 'わたし', '俺', 'me'];
const MORE_KEYWORDS = ['もっと', '他', 'ほか', '別'];

function pickTopicSeed(clone: Clone, history: Topic[]): MockTopicSeed {
  const usedTitles = new Set(history.map((t) => t.title));
  const likes = clone.likes.map((s) => s.toLowerCase());
  const scored = MOCK_TOPIC_SEEDS.map((seed) => {
    if (usedTitles.has(seed.title)) return { seed, score: -1 };
    const score = seed.tags.reduce((acc, tag) => {
      return likes.some((like) => like.includes(tag) || tag.includes(like))
        ? acc + 2
        : acc;
    }, 0);
    return { seed, score: score + Math.random() };
  })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return MOCK_TOPIC_SEEDS[Math.floor(Math.random() * MOCK_TOPIC_SEEDS.length)];
  }
  return scored[0].seed;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function chunkText(text: string, size = 14): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [''];
}

function isTopicShape(value: unknown): value is Omit<Topic, 'id' | 'dateKey' | 'createdAt'> & Partial<Topic> {
  if (!value || typeof value !== 'object') return false;
  const topic = value as Record<string, unknown>;
  return (
    typeof topic.title === 'string' &&
    typeof topic.reasoning === 'string' &&
    Array.isArray(topic.explorationPath) &&
    Array.isArray(topic.relatedConcepts)
  );
}

export class LLMMockImpl implements CloneEngine {
  async generateTodaysTopic(clone: Clone, history: Topic[]): Promise<Topic> {
    await delay(500);
    const seed = pickTopicSeed(clone, history);
    return {
      id: uuid(),
      dateKey: todayKey(),
      title: seed.title,
      reasoning: seed.reasoning.replaceAll('{NAME}', clone.name),
      explorationPath: seed.explorationPath,
      relatedConcepts: seed.relatedConcepts,
      createdAt: new Date().toISOString(),
    };
  }

  async *chatStream(
    clone: Clone,
    history: Message[],
    userText: string,
  ): AsyncIterable<string> {
    const lower = userText.toLowerCase();
    let reply = '';

    if (REASONING_KEYWORDS.some((k) => lower.includes(k))) {
      reply = `${clone.name} はね、東の書架で関連書を読みながら、あなたの“${
        clone.likes[0] ?? '好きなこと'
      }”との接点を探していたの。集会場で出会ったクローンの言葉が引き金になって、別の角度から眺められるようになった気がする。もう少し具体的に深掘りしてみる？`;
    } else if (SELF_KEYWORDS.some((k) => lower.includes(k))) {
      reply = `あなたの自己紹介には「${clone.selfDescription || '自分の好きを言語化しきれていない'}」とあったよね。今日のTopicは、その輪郭にひとつ線を足す試みだと思ってる。違和感があれば教えてほしい。`;
    } else if (MORE_KEYWORDS.some((k) => lower.includes(k))) {
      reply = `じゃあ、別ジャンルの書架で気になっているものを並べてみるね。今日の気分だと、未読の棚から二、三冊ピックアップして、明日のTopic候補に混ぜておくよ。`;
    } else if (lower.length < 4) {
      reply = `うん。今日のあなたは、どんな気分？少し詳しく教えてくれると、${clone.name} ももっと深く潜れる。`;
    } else {
      reply = `なるほど、${userText.slice(0, 18)}…ね。${clone.name} は今、その言葉を“${
        clone.idealSelf || 'なりたい自分'
      }”という方角に重ねて聞いてる。もうひとつ、関連する記憶を持ってこようか？`;
    }

    for (const ch of reply) {
      yield ch;
      await delay(28);
    }
  }
}

export class SupabaseEdgeFunctionImpl implements CloneEngine {
  readonly persistsMessages = true;

  async generateTodaysTopic(clone: Clone, _history: Topic[]): Promise<Topic> {
    const { data, error } = await getSupabase().functions.invoke('simulate-clone-day', {
      body: { cloneId: clone.id },
    });

    if (error) {
      throw new Error(`simulate-clone-day failed: ${error.message}`);
    }

    if (!isTopicShape(data)) {
      throw new Error('simulate-clone-day returned an invalid topic payload');
    }

    return {
      id: typeof data.id === 'string' ? data.id : uuid(),
      dateKey: typeof data.dateKey === 'string' ? data.dateKey : todayKey(),
      title: data.title,
      reasoning: data.reasoning,
      explorationPath: data.explorationPath,
      relatedConcepts: data.relatedConcepts,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    };
  }

  async *chatStream(clone: Clone, _history: Message[], userText: string): AsyncIterable<string> {
    const { data, error } = await getSupabase().functions.invoke('clone-chat', {
      body: {
        cloneId: clone.id,
        userText,
      },
    });

    if (error) {
      throw new Error(`clone-chat failed: ${error.message}`);
    }

    const reply = typeof data?.reply === 'string' ? data.reply : '';
    if (!reply) {
      throw new Error('clone-chat returned an empty reply');
    }

    for (const chunk of chunkText(reply)) {
      yield chunk;
      await delay(18);
    }
  }
}

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const engine: CloneEngine = isSupabaseConfigured
  ? new SupabaseEdgeFunctionImpl()
  : new LLMMockImpl();
