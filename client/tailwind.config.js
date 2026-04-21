/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neon green palette
        pitch: {
          50:  '#e6fff2',
          100: '#b3ffe0',
          200: '#66ffbf',
          300: '#00ffaa',
          400: '#00ff88',   // ← primary neon accent
          500: '#00e676',
          600: '#00c853',
          700: '#009e3d',
          800: '#006b28',
          900: '#003815',
          950: '#001508',
        },
        // Deep black surfaces
        surface: {
          DEFAULT: '#020b06',
          2: '#060f09',
          3: '#0c1a10',
          4: '#152b1a',
          5: '#1e3d24',
        },
        // Neon cyan for bowling
        cyan: {
          neon: '#00e5ff',
          dim:  '#00b8d4',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['Share Tech Mono', 'monospace'],
      },
      animation: {
        'score-pop':    'scorePop 0.35s ease-out',
        'fade-in':      'fadeIn 0.2s ease-in',
        'slide-up':     'slideUp 0.3s ease-out',
        'neon-pulse':   'neonPulse 2s ease-in-out infinite',
        'glow-flicker': 'glowFlicker 3s ease-in-out infinite',
      },
      keyframes: {
        scorePop: {
          '0%':   { transform: 'scale(1.25)', color: '#00ff88' },
          '100%': { transform: 'scale(1)',    color: 'inherit'  },
        },
        fadeIn:   { '0%': { opacity: 0 },  '100%': { opacity: 1 } },
        slideUp:  { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        neonPulse: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.7 },
        },
        glowFlicker: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,255,136,0.3)' },
          '50%':      { boxShadow: '0 0 18px rgba(0,255,136,0.6)' },
        },
      },
      boxShadow: {
        'neon-sm':  '0 0 6px rgba(0,255,136,0.4)',
        'neon-md':  '0 0 12px rgba(0,255,136,0.5), 0 0 24px rgba(0,255,136,0.2)',
        'neon-lg':  '0 0 20px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3)',
        'neon-cyan':'0 0 12px rgba(0,229,255,0.5)',
        'neon-red': '0 0 12px rgba(255,45,85,0.5)',
        'neon-amber':'0 0 12px rgba(255,214,10,0.5)',
        'card':     '0 0 0 1px rgba(0,255,136,0.08), 0 4px 24px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
