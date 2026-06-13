import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porsche:        '#D5001C',
        'porsche-dark': '#A8000F',
        ink:            '#121212',
        paper:          '#FFFFFF',
        canvas:         '#F3F2F0',
        cream:          '#FBEFE3',
        line:           '#E7E4E0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,18,18,.04), 0 1px 3px rgba(18,18,18,.06)',
        'card-hover': '0 6px 16px rgba(18,18,18,.10)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
export default config;
