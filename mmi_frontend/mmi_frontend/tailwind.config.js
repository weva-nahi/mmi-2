/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mmi: {
          green:      '#1B6B30',
          'green-mid':'#2E8B45',
          'green-lt': '#E8F5EC',
          gold:       '#C8A400',
          'gold-lt':  '#FDF6DA',
        }
      },
      fontFamily: {
        sans: ['Cairo', 'Montserrat', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
