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
