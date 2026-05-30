/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'serif'],
        display: ['"Aref Ruqaa"', 'Amiri', 'serif'],
      },
      colors: {
        ink: {
          950: '#070910',
          900: '#0b0e16',
          800: '#11151f',
          700: '#171c29',
          600: '#1f2636',
          500: '#2b3346',
        },
        brass: {
          300: '#f0d493',
          400: '#e0b04a',
          500: '#d4af37',
          600: '#b08d2a',
        },
        blood: {
          400: '#e74c3c',
          500: '#c0392b',
          600: '#92271c',
        },
        parchment: '#e9e5d8',
        muted: '#9aa3b2',
      },
      boxShadow: {
        glow: '0 0 30px rgba(212, 175, 55, 0.25)',
        bloodglow: '0 0 40px rgba(231, 76, 60, 0.45)',
        card: '0 18px 45px rgba(0, 0, 0, 0.55)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '0.85' },
          '50%': { opacity: '0.55' },
          '55%': { opacity: '0.9' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
