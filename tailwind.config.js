/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        script: ['Great Vibes', 'cursive'],
      },
      boxShadow: {
        royal: '0 10px 40px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
