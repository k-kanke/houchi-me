export const STORAGE_KEY = 'hochi_clone'

export const DEFAULT_CLONE = {
  name: 'Mira',
  displayName: 'Mira（ミラ）',
  mbti: 'ENFP',
  archetype: '感性探索型',
  likes: 'カフェ、韓ドラ、旅行、ファッション',
  personalityShift: '少し外向的',
  syncRate: '99.6%',
  uptime: '14:23',
  mood: '思索モード',
}

export const INITIAL_TIMELINE = [
  {
    id: 'tl-1',
    variant: 'amber',
    time: '14:23 · いま',
    text: '中央デスクで執筆を開始',
    tag: '執筆',
    tagVariant: 'amber',
  },
  {
    id: 'tl-2',
    variant: 'cyan',
    time: '13:48',
    text: '東の書架で「Generative Agents」を読了',
    tag: '読書',
    tagVariant: 'cyan',
  },
  {
    id: 'tl-3',
    variant: 'pink',
    time: '12:30',
    text: 'アイデアを記録：「クローンは反論すべき」',
    tag: 'アイデア',
    tagVariant: 'pink',
  },
  {
    id: 'tl-4',
    variant: '',
    time: '11:00',
    text: '天窓から外を眺めながら昨日の自動要約を生成',
    tag: null,
    tagVariant: null,
  },
]

export const TODAY_TOPIC = {
  title: 'カフェ巡り × フィルムカメラ',
  reason:
    'あなたはカフェの雰囲気や空間づくりに反応しやすい傾向があります。今日 Mira は東の書架で建築写真集を読み、そのあと集会場で出会った Sage（フィルムカメラ好き）と「カフェの時間を写真として残す楽しさ」について話しました。',
  notes: [
    'カフェ空間と照明の心理効果',
    '記録する趣味としてのカメラ',
    '空間と時間のアーカイブ',
  ],
}

export const CONVERSATION = [
  { who: 0, text: '記憶の"形"が量より重要だと思う' },
  { who: 1, text: 'でも文脈依存性はどうする？' },
  { who: 0, text: 'エピソードに紐付ければ解消できる' },
  { who: 2, text: '…静かに観測しています' },
  { who: 1, text: 'クローン同士の対話そのものが記憶だね' },
  { who: 0, text: '同意。摩擦から知識が生まれる' },
  { who: 2, text: '今の発話、3つの過去ノートに接続しました' },
  { who: 1, text: 'なら反論を続けよう。私はあえて疑う' },
  { who: 0, text: 'それでいい。クローンは鏡ではなく対話相手だ' },
]

export const CLONE_STATS = {
  notes: { val: 128, delta: '+21 ↑' },
  reads: { val: 17, delta: '+4 ↑' },
  thoughts: { val: 412, delta: '+86 ↑' },
  sync: { val: '99.6%', delta: '安定' },
}

export const PERSONALITY_SHIFTS = [
  '今の自分に近い',
  '少し外向的',
  '少し冒険的',
  '少し職人気質',
  '少しクリエイティブ',
  '少し社交的',
  '少しストイック',
]

export function loadClone() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...DEFAULT_CLONE, ...JSON.parse(raw) }
  } catch {
    return null
  }
}

export function saveClone(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
