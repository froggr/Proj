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
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#FFD700', // Bright gold
          500: '#FFD700', // Bright gold
          600: '#D4AF37', // Classic gold
          700: '#B8960A',
          800: '#9A7D0A',
          900: '#7D6608',
        }
      }
    },
  },
  plugins: [],
}
