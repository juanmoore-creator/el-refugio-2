/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'muted-olive': '#A3B5A6', // Soft Sage
        'snow': '#FAFAF9',       // Warm Stone
        'olive-bark': '#8B7E66', // Driftwood
        'hunter-green': '#1A3C34', // Deep Rainforest
        'blue-slate': '#4A5F6D', // Deep Ocean Slate
        'gold-sand': '#D4C4A8',  // Soft Gold Highlight
      },
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

