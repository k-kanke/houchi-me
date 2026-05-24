// 全画面で共有するダミーデータ

export const experiences = [
  {
    id: '1',
    title: 'はじめての陶芸ミニ体験',
    genre: 'ものづくり',
    creator: 'Yuki Tanaka',
    creatorAvatar: '🧑‍🎨',
    location: '下北沢',
    price: '初回無料',
    pointReward: 120,
    isFirstTimeFree: true,
    isBeginnerFriendly: true,
    isFriendOk: true,
    capacity: 6,
    reservedCount: 3,
    description: '土をこねて、自分だけの小皿を作る初心者向け体験。道具はすべて用意されているので手ぶらでOK。',
    startTime: '土曜 14:00〜15:00',
    duration: '60分',
    thumbnailUrl: null,
  },
  {
    id: '2',
    title: 'フィルムカメラで街歩き',
    genre: '写真・散歩',
    creator: 'Haruto Ito',
    creatorAvatar: '📸',
    location: '谷根千',
    price: '500円',
    pointReward: 150,
    isFirstTimeFree: false,
    isBeginnerFriendly: true,
    isFriendOk: true,
    capacity: 8,
    reservedCount: 5,
    description: '使い捨てフィルムカメラで谷根千を散歩。現像まで体験できます。',
    startTime: '日曜 10:00〜12:00',
    duration: '120分',
    thumbnailUrl: null,
  },
  {
    id: '3',
    title: '金継ぎ入門ワークショップ',
    genre: '伝統工芸',
    creator: 'Saki Mori',
    creatorAvatar: '🍵',
    location: '蔵前',
    price: '2,000円',
    pointReward: 180,
    isFirstTimeFree: false,
    isBeginnerFriendly: true,
    isFriendOk: false,
    capacity: 4,
    reservedCount: 2,
    description: '割れた器を金で繋ぐ日本の伝統技法。自分の器を持参してもOK。',
    startTime: '土曜 13:00〜15:00',
    duration: '120分',
    thumbnailUrl: null,
  },
  {
    id: '4',
    title: 'ボードゲーム初心者会',
    genre: '遊び・交流',
    creator: 'Ren Yamamoto',
    creatorAvatar: '🎲',
    location: '渋谷',
    price: '初回無料',
    pointReward: 80,
    isFirstTimeFree: true,
    isBeginnerFriendly: true,
    isFriendOk: true,
    capacity: 10,
    reservedCount: 6,
    description: '有名ボドゲから変わり種まで。ルール説明から一緒にやります。',
    startTime: '金曜 19:00〜21:00',
    duration: '120分',
    thumbnailUrl: null,
  },
  {
    id: '5',
    title: 'カリグラフィー体験会',
    genre: '文字・アート',
    creator: 'Mia Nakashima',
    creatorAvatar: '✒️',
    location: '表参道',
    price: '1,500円',
    pointReward: 200,
    isFirstTimeFree: false,
    isBeginnerFriendly: true,
    isFriendOk: true,
    capacity: 6,
    reservedCount: 1,
    description: 'ペン1本で美しい文字を書く西洋書道。自分の名前を英語で書いてみよう。',
    startTime: '水曜 18:30〜20:00',
    duration: '90分',
    thumbnailUrl: null,
  },
]

export const initialUser = {
  name: 'ミサキ',
  avatar: '🌱',
  points: 320,
  title: '好奇心ビギナー',
  nextTitle: '探究するハンター',
  nextTitlePoints: 500,
  joinedCount: 3,
  genreCount: 3,
}

// 好奇心マップ
export const curiosityMap = [
  {
    cluster: '手を動かす系',
    icon: '🛠',
    items: [
      { name: '陶芸', level: 1, max: 5 },
      { name: 'レザー', level: 0, max: 5 },
    ],
  },
  {
    cluster: '空間を楽しむ系',
    icon: '🗺',
    items: [
      { name: 'カフェ巡り', level: 2, max: 5 },
      { name: '街歩き', level: 1, max: 5 },
    ],
  },
  {
    cluster: '人と遊ぶ系',
    icon: '🤝',
    items: [
      { name: 'ボドゲ', level: 1, max: 5 },
    ],
  },
]

// プロフィール初期：参加済みログ
export const initialLogs = [
  {
    id: 'log-1',
    title: '陶芸体験',
    date: '2026/04/12',
    comment: '土の手触りが思ったより気持ちよかった。次は湯呑みを作りたい。',
    funRating: 5,
    againRating: 4,
    pointEarned: 150,
  },
]

// プロフィール初期：予約中
export const initialReservations = [
  {
    id: 'r-seed-1',
    experienceId: '1',
    title: '陶芸ミニ体験会',
    startTime: '土曜 14:00',
    location: '下北沢',
    completed: false,
  },
]

// 投稿画面のジャンル選択肢
export const genres = ['ものづくり', '写真・散歩', '伝統工芸', '遊び・交流', '文字・アート', 'その他']

// 次に気になるジャンル候補（S5）
export const nextGenreSuggestions = [
  'ガラス細工',
  'レザークラフト',
  'シルバーリング',
  '書道',
  '日本茶',
  '盆栽',
  '陶芸（上級）',
  '木工',
]

// ポイント交換イメージ（S3）
export const pointExchanges = [
  { points: 500, reward: 'Amazonギフト券 100円分', icon: '🎁' },
  { points: 500, reward: 'PayPayポイント 100円分', icon: '💴' },
  { points: 1200, reward: '街の喫茶店ペアチケット', icon: '☕️' },
]
