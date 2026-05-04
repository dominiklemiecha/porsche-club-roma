import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porsche: '#B12B28',
        cream:   '#EBD698',
        ink:     '#000000',
      },
    },
  },
  plugins: [],
};
export default config;
