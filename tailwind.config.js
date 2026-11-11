/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rr-bg': '#0B1020',
        'rr-bg-secondary': '#121A2D',
        'rr-card': '#171F35',
        'rr-card-hover': '#1F2947',
        'rr-border': '#29334C',
        'rr-border-light': '#384666',
        'rr-pink': '#E90074',
        'rr-pink-hover': '#FF1A8C',
        'rr-purple': '#7545C8',
        'rr-purple-hover': '#8B5CF6',
        'rr-lavender': '#C9C3DF',
        'rr-text-primary': '#F7F7FB',
        'rr-text-secondary': '#929BB2',
        'rr-text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'rr-card': '0 4px 20px -2px rgba(11, 16, 32, 0.7), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        'rr-pink': '0 0 20px -3px rgba(233, 0, 116, 0.35)',
        'rr-purple': '0 0 20px -3px rgba(117, 69, 200, 0.35)',
      }
    },
  },
  plugins: [],
}

