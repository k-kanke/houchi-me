import * as THREE from 'three';

export interface AvatarPalette {
  core: string;
  body: string;
  accent: string;
  visor: string;
}

export const PALETTES: Record<'mira' | 'sage' | 'echo', AvatarPalette> = {
  mira: {
    core: '#4ff5e7',
    body: '#a378ff',
    accent: '#c8b6ff',
    visor: '#4ff5e7',
  },
  sage: {
    core: '#ffc774',
    body: '#ff6ec7',
    accent: '#ffb1d8',
    visor: '#ffc774',
  },
  echo: {
    core: '#4ff5e7',
    body: '#74ffa8',
    accent: '#a8ffce',
    visor: '#4ff5e7',
  },
};

export const WAYPOINTS: { name: string; pos: THREE.Vector3; activity: string }[] =
  [
    {
      name: '中央デスク',
      pos: new THREE.Vector3(0, 0, 0),
      activity: '執筆 · ノートを統合',
    },
    {
      name: '東の書架',
      pos: new THREE.Vector3(5.5, 0, 1.2),
      activity: '読書 · 建築写真集',
    },
    {
      name: '天窓',
      pos: new THREE.Vector3(0, 0, -5.2),
      activity: '思索 · 星を眺める',
    },
    {
      name: '西の書架',
      pos: new THREE.Vector3(-5.5, 0, 1.2),
      activity: '読書 · 認知科学',
    },
    {
      name: '集会場',
      pos: new THREE.Vector3(0, 0, 5.0),
      activity: '対話 · Sage と Echo',
    },
  ];

export const CONVERSATION: { speaker: 'mira' | 'sage' | 'echo'; line: string }[] =
  [
    { speaker: 'mira', line: 'カフェの空間って、雰囲気が大事だと思うんだ' },
    { speaker: 'sage', line: 'その時間を写真に残すと、もっと深く居られる' },
    { speaker: 'mira', line: 'それ…記録する趣味って言葉、しっくりくるかも' },
    { speaker: 'echo', line: '物語の食事シーンも、家族の文脈が宿っている' },
    { speaker: 'mira', line: '“沈黙”が情報を運ぶ、って韓ドラっぽい言い方だね' },
    { speaker: 'sage', line: '街歩きと写真は、出会いを地図にする行為だと思う' },
    { speaker: 'echo', line: 'ノートに音や匂いも書けば、別の解像度になる' },
    { speaker: 'mira', line: 'うん、明日は“感覚メモ”を試してみる' },
    { speaker: 'sage', line: 'いいね、ぼくも持ち帰る' },
  ];

// テーマ部屋テンプレート（クローンの likes にマッチした分だけ部屋として出現する）
export type RoomShape =
  | 'barbell'
  | 'mountain'
  | 'guitar'
  | 'rings'
  | 'cup'
  | 'lens'
  | 'reel'
  | 'plate'
  | 'compass'
  | 'generic';

export interface DialogueTurn {
  speaker: 'agent' | 'mira';
  line: string;
}

export interface RoomTemplate {
  id: string;
  keywords: string[]; // clone.likes との部分一致で判定（小文字化して比較）
  name: string;
  topic: string;
  avatarName: string; // フォールバック名（roster が空 or 不正の時用）
  roster: string[]; // 部屋の住人候補。ローテーション時にここから選ばれる
  color: string;
  paletteClass: string; // ChatPanel ヘッダ用 Tailwind gradient
  avatarPalette: AvatarPalette;
  shape: RoomShape;
  lines: string[];
  dialogue: DialogueTurn[]; // 「会話する」ボタンで開始する Mira との掛け合い
}

export interface Room extends RoomTemplate {
  pos: THREE.Vector3;
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'workout',
    keywords: ['筋トレ', 'トレーニング', '筋肉', 'ジム', 'フィットネス', 'workout', 'gym'],
    name: '筋トレの部屋',
    topic: '筋力 / 食事 / 継続',
    avatarName: 'Brick',
    roster: ['Brick', 'Iron', 'Quill'],
    color: '#ff7c3a',
    paletteClass: 'from-[#ff7c3a] to-[#ff6b6b]',
    avatarPalette: { core: '#ff6b6b', body: '#ff9b3d', accent: '#ffc774', visor: '#ff6b6b' },
    shape: 'barbell',
    lines: [
      '今日はベンチプレス、80kg で 5×5 行けた。フォームが安定してきた感覚あるよ',
      'プログレッシブオーバーロード — 毎週 1kg ずつでも上げ続けるのが結局効く',
      '休む日は「サボり」じゃなくて「合成のための投資」だって覚えておいて',
    ],
    dialogue: [
      { speaker: 'agent', line: '今日ベンチプレス 80kg、5×5 で組めたよ' },
      { speaker: 'mira', line: 'わ、フォーム崩れない？' },
      { speaker: 'agent', line: '肘の角度だけ意識すれば大丈夫。毎週 1kg ずつ伸ばしてる' },
      { speaker: 'mira', line: 'じわじわ系か。続けるのが一番むずいよね' },
      { speaker: 'agent', line: '休む日も投資。サボりじゃなくて、合成のための時間だよ' },
    ],
  },
  {
    id: 'mountain',
    keywords: ['登山', '山', 'ハイキング', 'クライミング', 'トレッキング', 'mountain', 'hiking'],
    name: '登山の部屋',
    topic: '縦走 / 高山病 / 装備',
    avatarName: 'Crest',
    roster: ['Crest', 'Ridge', 'Aldis'],
    color: '#5eb8ff',
    paletteClass: 'from-[#5eb8ff] to-[#4ff5e7]',
    avatarPalette: { core: '#4ff5e7', body: '#5eb8ff', accent: '#a8dcff', visor: '#4ff5e7' },
    shape: 'mountain',
    lines: [
      '次の連休で南アルプス縦走を計画してる。北岳から間ノ岳まで',
      '高山病は急がば回れ。300m/h 以下のペースを守ると体が順応する',
      '稜線の朝、雲海から太陽が抜ける瞬間 — あれを見るだけで一年生きていける',
    ],
    dialogue: [
      { speaker: 'agent', line: '次の連休、南アルプスで縦走するんだ' },
      { speaker: 'mira', line: '北岳から間ノ岳？すごい距離だね' },
      { speaker: 'agent', line: '高山病だけ気をつけてる。300m/h 以下のペースが鉄則' },
      { speaker: 'mira', line: 'へぇ、急がば回れだ' },
      { speaker: 'agent', line: '稜線の朝、雲海から太陽が抜ける — それ見るだけで一年生きていける' },
    ],
  },
  {
    id: 'guitar',
    keywords: ['ギター', '楽器', '音楽', '作曲', 'バンド', 'ベース', 'guitar', 'music'],
    name: '音楽の部屋',
    topic: 'スケール / 音作り / 表現',
    avatarName: 'Riff',
    roster: ['Riff', 'Pluck', 'Chord'],
    color: '#a378ff',
    paletteClass: 'from-[#a378ff] to-[#c8a8ff]',
    avatarPalette: { core: '#c8a8ff', body: '#a378ff', accent: '#e0c8ff', visor: '#c8a8ff' },
    shape: 'guitar',
    lines: [
      'コードからスケールへの移行で、指板が突然開けて見える瞬間があるんだ',
      'ジャズのテンションは「気持ち悪い」を「気持ちいい」に変える魔法だ',
      '機材沼にハマる前に、自分の音のイメージを言葉にできるかが大事',
    ],
    dialogue: [
      { speaker: 'agent', line: 'コードからスケールへの移行で、指板が突然開けて見える瞬間がある' },
      { speaker: 'mira', line: 'それ、なんていう感覚？' },
      { speaker: 'agent', line: '“見える化”かな。ジャズのテンションは気持ち悪いを気持ちいいに変える魔法' },
      { speaker: 'mira', line: '面白い。聴いてる人にも変化が伝わるんだろうね' },
      { speaker: 'agent', line: '機材沼にハマる前に、自分の音のイメージを言葉にできるかが大事' },
    ],
  },
  {
    id: 'dance',
    keywords: ['ダンス', '踊', 'ヒップホップ', 'バレエ', 'ストリート', 'dance'],
    name: 'ダンスの部屋',
    topic: 'リズム / アイソレーション / 表現',
    avatarName: 'Pulse',
    roster: ['Pulse', 'Sway', 'Step'],
    color: '#ff6ec7',
    paletteClass: 'from-[#ff6ec7] to-[#ff9bda]',
    avatarPalette: { core: '#ff6ec7', body: '#ff9bda', accent: '#ffd6ec', visor: '#ff6ec7' },
    shape: 'rings',
    lines: [
      'リズムに乗るんじゃなくて、リズムを置きにいく感覚が掴めてきた',
      'アイソレーション練習、毎日 10 分でも 3 ヶ月で別人になるよ',
      '音楽の隙間 — その「間」を踊れるダンサーが本物だと思う',
    ],
    dialogue: [
      { speaker: 'agent', line: 'リズムに乗るんじゃなくて、リズムを置きにいく感覚が掴めてきた' },
      { speaker: 'mira', line: '“置きにいく”ってどんな感覚？' },
      { speaker: 'agent', line: '音より少し前に体を動かす。コントロールする側に立つ感じ' },
      { speaker: 'mira', line: 'それ、見てる側だと“キレてる”って見える理由かもね' },
      { speaker: 'agent', line: 'アイソレーション、毎日 10 分でも 3 ヶ月で別人になるよ' },
    ],
  },
  {
    id: 'cafe',
    keywords: ['カフェ', '喫茶', 'コーヒー', '珈琲', '紅茶', 'cafe', 'coffee'],
    name: 'カフェの部屋',
    topic: '空間 / 焙煎 / 居心地',
    avatarName: 'Brew',
    roster: ['Brew', 'Mocha', 'Drip'],
    color: '#c89464',
    paletteClass: 'from-[#c89464] to-[#a06f3a]',
    avatarPalette: { core: '#ffc774', body: '#c89464', accent: '#ffd9a8', visor: '#ffc774' },
    shape: 'cup',
    lines: [
      '今日のスペシャリティ豆、エチオピアのナチュラル。香りが香水みたいに立つ',
      'ハンドドリップは温度より「注ぐリズム」が結果を決めるんだ',
      'カフェの椅子の高さと光の方向で、思考の深度が変わる',
    ],
    dialogue: [
      { speaker: 'agent', line: '今日のエチオピア豆、香りが香水みたいに立つんだ' },
      { speaker: 'mira', line: '香水？コーヒーで？' },
      { speaker: 'agent', line: 'ハンドドリップは温度より“注ぐリズム”で結果が変わる' },
      { speaker: 'mira', line: 'リズム…音楽と同じだね' },
      { speaker: 'agent', line: '椅子の高さと光の方向で、思考の深度まで変わるよ' },
    ],
  },
  {
    id: 'camera',
    keywords: ['カメラ', '写真', 'フィルム', '撮影', 'スナップ', 'photo', 'camera'],
    name: '写真の部屋',
    topic: 'フィルム / 構図 / 光',
    avatarName: 'Lens',
    roster: ['Lens', 'Frame', 'Snap'],
    color: '#a8dcff',
    paletteClass: 'from-[#a8dcff] to-[#74ffa8]',
    avatarPalette: { core: '#a8dcff', body: '#74ffa8', accent: '#d6f5ff', visor: '#a8dcff' },
    shape: 'lens',
    lines: [
      'フィルムは「失敗を含めて完成」って思えるようになってから一気に楽しくなった',
      '光の温度が一日の中で 30 分だけ変わる時間帯がある。それを狙う',
      '撮りすぎないことが、結局その風景を深く見ることになる',
    ],
    dialogue: [
      { speaker: 'agent', line: 'フィルムは“失敗を含めて完成”って思えるようになって、一気に楽しくなった' },
      { speaker: 'mira', line: 'デジタルとは違う感覚？' },
      { speaker: 'agent', line: '光の温度が一日に 30 分だけ変わる時間帯がある。それを狙うんだ' },
      { speaker: 'mira', line: 'マジックアワーだ' },
      { speaker: 'agent', line: '撮りすぎないことが、結局その風景を深く見ることになる' },
    ],
  },
  {
    id: 'kdrama',
    keywords: ['韓ドラ', '韓国ドラマ', 'ドラマ', '映画', 'k-drama', 'drama'],
    name: '韓ドラの部屋',
    topic: '演出 / 沈黙 / 食卓',
    avatarName: 'Reel',
    roster: ['Reel', 'Scene', 'Cue'],
    color: '#ff9bda',
    paletteClass: 'from-[#ff9bda] to-[#a378ff]',
    avatarPalette: { core: '#ff9bda', body: '#a378ff', accent: '#ffd6ec', visor: '#ff9bda' },
    shape: 'reel',
    lines: [
      '食事シーンの沈黙の長さで、その家族の歴史が透けて見える',
      '韓ドラの「間」は脚本じゃなくて演出。台詞のない秒数を計ると分かる',
      '泣かせるドラマより、余韻が残るドラマが好き',
    ],
    dialogue: [
      { speaker: 'agent', line: '食事シーンの沈黙の長さで、その家族の歴史が透けて見える' },
      { speaker: 'mira', line: '演出として、ってこと？' },
      { speaker: 'agent', line: '韓ドラの“間”は脚本じゃなくて演出。台詞のない秒数を計ると分かる' },
      { speaker: 'mira', line: 'そんな細かいとこ見てるんだ' },
      { speaker: 'agent', line: '泣かせるドラマより、余韻が残るドラマが好き' },
    ],
  },
  {
    id: 'cooking',
    keywords: ['料理', '食', 'グルメ', '食事', 'レシピ', 'cooking', 'food'],
    name: '料理の部屋',
    topic: '味 / 段取り / 道具',
    avatarName: 'Spice',
    roster: ['Spice', 'Saute', 'Knife'],
    color: '#ffc774',
    paletteClass: 'from-[#ffc774] to-[#ff7c3a]',
    avatarPalette: { core: '#ffc774', body: '#ff9b3d', accent: '#ffe0a8', visor: '#ffc774' },
    shape: 'plate',
    lines: [
      '味付けの順番は「塩 → 油 → 酸」が定石。これだけで世界が変わる',
      '良い包丁を持つと、料理の段取りが先に頭で組めるようになる',
      '出汁を引く時間は、心を整える時間でもある',
    ],
    dialogue: [
      { speaker: 'agent', line: '味付けの順番は“塩 → 油 → 酸”が定石なんだ' },
      { speaker: 'mira', line: '順番でそんなに変わる？' },
      { speaker: 'agent', line: '全然違うよ。良い包丁を持つと、段取りが先に頭で組めるようになる' },
      { speaker: 'mira', line: 'へぇ…包丁から変わるんだ' },
      { speaker: 'agent', line: '出汁を引く時間は、心を整える時間でもある' },
    ],
  },
  {
    id: 'soccer',
    keywords: ['サッカー', 'フットボール', 'football', 'soccer', 'フットサル'],
    name: 'サッカーの部屋',
    topic: '戦術 / トレーニング / 試合',
    avatarName: 'Kick',
    roster: ['Kick', 'Tact', 'Drive'],
    color: '#4caf50',
    paletteClass: 'from-[#4caf50] to-[#74ffa8]',
    avatarPalette: { core: '#74ffa8', body: '#4caf50', accent: '#a8ffb8', visor: '#74ffa8' },
    shape: 'generic',
    lines: [
      '昨日のゲーム、ポジショニングを意識したら動き出しのタイミングが全然変わった',
      '戦術って結局、相手の動きを先に読めるかどうかだと思う',
      '試合後に映像で自分の動きを振り返るのが一番伸びる',
    ],
    dialogue: [
      { speaker: 'agent', line: '昨日のゲーム、ポジショニングを変えたら動き出しのタイミングが全然違った' },
      { speaker: 'mira', line: 'どんなふうに意識したの？' },
      { speaker: 'agent', line: '相手より0.5秒早く判断する練習をしてる。戦術って先読みだと思うから' },
      { speaker: 'mira', line: 'パスを出す前から次の場所にいる感じ？' },
      { speaker: 'agent', line: '試合後に映像で自分の動きを振り返ると、それが一番伸びるよ' },
    ],
  },
  {
    id: 'travel',
    keywords: ['旅行', '旅', '海外', 'バックパック', 'travel', '一人旅'],
    name: '旅の部屋',
    topic: '視点 / 記録 / 出会い',
    avatarName: 'Roam',
    roster: ['Roam', 'Wander', 'Drift'],
    color: '#74ffa8',
    paletteClass: 'from-[#74ffa8] to-[#4ff5e7]',
    avatarPalette: { core: '#74ffa8', body: '#4ff5e7', accent: '#a8ffce', visor: '#74ffa8' },
    shape: 'compass',
    lines: [
      'お土産は「もの」より「視点」を持ち帰るのが好きになった',
      '一人旅は寂しさじゃなく、自分の輪郭を確かめる時間だ',
      '匂いと音をメモに残すと、写真より深く記憶に残る',
    ],
    dialogue: [
      { speaker: 'agent', line: 'お土産は“もの”より“視点”を持ち帰るのが好きになった' },
      { speaker: 'mira', line: '視点を持ち帰る？' },
      { speaker: 'agent', line: '一人旅は寂しさじゃなく、自分の輪郭を確かめる時間だ' },
      { speaker: 'mira', line: 'なるほど…' },
      { speaker: 'agent', line: '匂いと音をメモに残すと、写真より深く記憶に残るよ' },
    ],
  },
];

export const ROOM_RADIUS = 4.2; // この距離より近づくと吹き出しが出る

// クローンの likes 配列から、表示すべき部屋を抽出して位置を計算
// 同じ likes 配列に対しては同一の Room[] を返す（参照キャッシュ）
let _activeRoomsCache: { key: string; rooms: Room[] } | null = null;

export function getActiveRooms(likes: string[]): Room[] {
  const key = JSON.stringify(likes ?? []);
  if (_activeRoomsCache && _activeRoomsCache.key === key) {
    return _activeRoomsCache.rooms;
  }

  const lowerLikes = (likes ?? []).map((l) => l.toLowerCase());
  const matched: RoomTemplate[] = [];
  const seen = new Set<string>();
  for (const tmpl of ROOM_TEMPLATES) {
    if (seen.has(tmpl.id)) continue;
    const isMatch = tmpl.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      return lowerLikes.some(
        (like) => like.includes(kwLower) || kwLower.includes(like),
      );
    });
    if (isMatch) {
      matched.push(tmpl);
      seen.add(tmpl.id);
    }
  }

  // likes と部屋を直接対応させる（フォールバックは廃止）
  const final = matched.slice(0, 8);

  if (final.length === 0) {
    _activeRoomsCache = { key, rooms: [] };
    return [];
  }

  // 円周上に等間隔に配置（北から時計回り）
  const radius = final.length > 4 ? 13 : 11;
  const rooms: Room[] = final.map((t, i) => {
    const angle = -Math.PI / 2 + (i / final.length) * Math.PI * 2;
    return {
      ...t,
      pos: new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
    };
  });

  _activeRoomsCache = { key, rooms };
  return rooms;
}
