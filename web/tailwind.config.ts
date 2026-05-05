import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porsche: '#B12B28',
        cream:   '#EBD698',
        sand:    '#F7F1E1',
        paper:   '#FFFFFF',
        ink:     '#000000',
      },
    },
  },
  plugins: [],
};
export default config;
