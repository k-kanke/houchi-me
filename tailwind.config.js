/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#141414',
          elevated: '#1C1C1C',
        },
        accent: {
          DEFAULT: '#FF5C00',
          soft: 'rgba(255, 92, 0, 0.12)',
          ring: 'rgba(255, 92, 0, 0.4)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#555555',
        },
        line: '#2A2A2A',
        success: '#00E5A0',
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Noto Sans JP"', 'sans-serif'],
        sans: ['"Noto Sans JP"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px 0 rgba(255, 92, 0, 0.35)',
        card: '0 8px 32px 0 rgba(0,0,0,0.5)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,92,0,0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255,92,0,0)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
