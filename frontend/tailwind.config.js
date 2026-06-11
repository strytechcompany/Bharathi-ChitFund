/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        'gold-hover': '#C5A030',
        cream: '#FAF8F2',
        sidebar: '#1C1C2E',
      },
    },
  },
  plugins: [],
};

