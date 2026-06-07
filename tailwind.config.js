/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          light: '#2a5298',
          dark: '#152a45',
        },
        accent: {
          DEFAULT: '#d4a574',
          light: '#e0c4a0',
          dark: '#b8956a',
        },
        success: '#4ecdc4',
        danger: '#ff6b6b',
        warning: '#f59e0b',
        surface: {
          DEFAULT: '#f8f6f3',
          dark: '#1a1a2e',
          card: '#ffffff',
          'card-dark': '#252542',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Palatino', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Noto Sans SC"', '"Source Han Sans CN"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(30,58,95,0.08)',
        'card-hover': '0 8px 24px rgba(30,58,95,0.12)',
        glow: '0 0 20px rgba(212,165,116,0.3)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        shimmer: 'shimmer 2s infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 165, 116, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 165, 116, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
