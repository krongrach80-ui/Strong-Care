/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        strongCare: {
          primary: '#6FCF97',
          dark: '#3FAF70',
          light: '#E8F8EF',
          bg: '#F8FAF9',
          surface: '#FFFFFF',
          text: '#1F2937',
          secondary: '#6B7280',
          border: '#E5E7EB',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        primary: {
          50: '#f0fdf4',
          100: '#E8F8EF',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#6FCF97',
          500: '#3FAF70',
          600: '#22c55e',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      borderRadius: {
        'card': '18px',
        'button': '12px',
        'input': '12px',
        'modal': '20px',
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(111, 207, 151, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(111, 207, 151, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
