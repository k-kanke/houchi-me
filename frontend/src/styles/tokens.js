// 放置me — 仮想世界 UI トークン（index.html モック準拠）
export const hochiColors = {
  bg0: '#03040f',
  bg1: '#07091e',
  neonCyan: '#4ff5e7',
  neonViolet: '#a378ff',
  neonPink: '#ff6ec7',
  neonAmber: '#ffc774',
  neonGreen: '#74ffa8',
  text0: '#ffffff',
  text1: '#d8dbf2',
  text2: '#8f93b8',
  text3: '#5b5f86',
}

// 旧 Curio Meet（未使用画面用・残置）
export const colors = {
  bgPrimary: '#0A0A0A',
  bgSecondary: '#141414',
  bgElevated: '#1C1C1C',
  accent: '#FF5C00',
  accentSoft: 'rgba(255, 92, 0, 0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#555555',
  border: '#2A2A2A',
  success: '#00E5A0',
}

export const genreVisuals = {
  'ものづくり': {
    gradient: 'linear-gradient(135deg, #3a1f0a 0%, #8a4a1f 50%, #c47438 100%)',
    emoji: '🏺',
    accent: '#E08A4A',
  },
  '写真・散歩': {
    gradient: 'linear-gradient(135deg, #0c1a2a 0%, #1f3a5a 60%, #3a6090 100%)',
    emoji: '📷',
    accent: '#6FA0D8',
  },
  '伝統工芸': {
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #4a1f1f 50%, #8a3a2a 100%)',
    emoji: '🍶',
    accent: '#D8B070',
  },
  '遊び・交流': {
    gradient: 'linear-gradient(135deg, #1a0a2a 0%, #3a1f5a 50%, #7038a0 100%)',
    emoji: '🎲',
    accent: '#B080FF',
  },
  '文字・アート': {
    gradient: 'linear-gradient(135deg, #0a1a1a 0%, #1f3a3a 50%, #2a6060 100%)',
    emoji: '✒️',
    accent: '#70D8C8',
  },
  default: {
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    emoji: '✨',
    accent: '#FF5C00',
  },
}

export const getGenreVisual = (genre) => genreVisuals[genre] || genreVisuals.default
