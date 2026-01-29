import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#000000',
          card: 'rgba(255,255,255,0.03)',
          admin: '#0a0a0a',
          sidebar: '#0d0d0d',
        },
        accent: {
          DEFAULT: '#00ff88',
          muted: 'rgba(0,255,136,0.15)',
          bg: 'rgba(0,255,136,0.08)',
        },
        'text-primary': '#ffffff',
        'text-muted': '#888888',
        border: 'rgba(255,255,255,0.08)',
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        success: '#00ff88',
        warning: '#f97316',
        'warning-bg': 'rgba(249,115,22,0.15)',
        danger: '#ff4444',
        'danger-bg': 'rgba(255,68,68,0.15)',
        'blue-badge': '#3b82f6',
        purple: '#a855f7',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      maxWidth: {
        container: '1200px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 0.5s infinite',
        'bounce-slow': 'bounce 1s ease-in-out infinite',
        'glow': 'glow 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'confetti-fall': 'confetti-fall 3s ease-out forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,255,136,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0,255,136,0.4)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) rotate(45deg)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-100px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
