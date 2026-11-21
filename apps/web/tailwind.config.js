/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',      // Electric Blue
          blueHover: '#1D4ED8',
          blueLight: '#DBEAFE',
          cyan: '#06B6D4',      // Cyan Accent
          cyanHover: '#0891B2',
          cyanLight: '#CFFAFE',
          navy: '#0F172A',      // Deep Navy Text / Slate 900
          navyMuted: '#334155', // Slate 700
          offWhite: '#F8FAFC',  // Soft Off-White
          surface: '#FFFFFF',
          surfaceDark: '#0F172A',
          darkBg: '#090D16',
          cardDark: '#131B2E',
          borderDark: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: { '3xl': '1.5rem' },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -10px rgba(37, 99, 235, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
      },
    },
  },
  plugins: [],
};
