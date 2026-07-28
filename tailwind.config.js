/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#34C98E', // Primary CTA
          600: '#2A9A6D',
        },
        cerulean: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#4DA6D9', // Links, info
          600: '#3A83AD',
        },
        sand: {
          50: '#F4F7F6', // Off-white bg
          100: '#F8FAFC', // Alt off-white
        },
        // Kept for backward compatibility
        obsidian: {
          DEFAULT: '#0B0C10',
          soft: '#111318',
          panel: '#14161C',
        },
        cyan: {
          signal: '#66FCF1',
        },
        amber: {
          signal: '#FFC107',
        },
        crimson: {
          signal: '#EF4444', // Updated to WCAG compliant red
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px 0 rgba(102, 252, 241, 0.25)',
        'glow-amber': '0 0 24px 0 rgba(255, 193, 7, 0.28)',
        'glow-crimson': '0 0 28px 0 rgba(239, 68, 68, 0.32)',
        'clay': '0 8px 32px rgba(52,201,142,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'clay-hover': '0 12px 36px rgba(52,201,142,0.18), 0 4px 12px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 50% 0%, rgba(102,252,241,0.08), transparent 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scan: 'scan 2.4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
