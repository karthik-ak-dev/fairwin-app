import type { Config } from 'tailwindcss'

// Tailwind CSS configuration
// - Custom color palette with Electric Blue (#0099ff) accent and Dark Navy (#0a0e1a) background
// - Outfit font family for typography
// - Extended utilities for glassmorphism effects
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e1a',
        accent: '#0099ff',
        gold: '#FFD700',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
