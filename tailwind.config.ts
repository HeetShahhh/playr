import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // V2 dark palette
        navy:     '#0A1628',
        'navy-2': '#0D1B2A',
        'navy-3': '#162237',
        lime:     '#B6F000',
        orange:   '#E85D1A',
        // Text
        'text-primary':   '#F2F2EC',
        'text-secondary': '#8A9BB0',
        // Sport accents
        badminton:  '#00A86B',
        pickleball: '#FF6B35',
        tennis:     '#E8A020',
        cricket:    '#1A5CFF',
        basketball: '#E83038',
        squash:     '#8B5CF6',
        // Legacy
        chalk:  '#F2F2EC',
        muted:  '#8A9BB0',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'DM Sans', 'sans-serif'],
        mono:    ['var(--font-mono)',    'JetBrains Mono', 'monospace'],
        body:    ['var(--font-body)',    'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card:    '12px',
        pill:    '100px',
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
};

export default config;
