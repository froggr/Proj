/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf4ec',
          100: '#fbe8d8',
          200: '#f7d1b1',
          300: '#f0ab73',
          400: '#e49255',
          500: '#D87E38', // Brand orange-gold from logo
          600: '#c26d28',
          700: '#a15a20',
          800: '#82491e',
          900: '#6a3d1d',
        }
      }
    },
  },
  plugins: [],
}
