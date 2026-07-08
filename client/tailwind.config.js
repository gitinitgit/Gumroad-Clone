export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: { DEFAULT: '#ff90e8', 50: '#fff0fb', 100: '#ffe0f7', 500: '#ff90e8', 600: '#e070cc', 700: '#c050b0' },
        purple: { DEFAULT: '#90a8ed', 500: '#90a8ed' },
        green: { DEFAULT: '#23a094', 500: '#23a094', 600: '#1a8477' },
        orange: { DEFAULT: '#ffc900', 500: '#ffc900' },
        yellow: { DEFAULT: '#f1f333', 500: '#f1f333' },
        gumroad: {
          black: '#242423',
          white: '#f4f4f0',
          border: '#e5e5e1',
          red: '#dc341e',
        },
      },
      fontFamily: {
        sans: ['"ABC Favorit"', '"Plus Jakarta Sans"', 'Avenir', 'Montserrat', 'Corbel', 'source-sans-pro', 'sans-serif'],
        display: ['"ABC Favorit"', '"Plus Jakarta Sans"', 'sans-serif'],
        gumicons: ['gumicons'],
      },
      borderRadius: {
        gum: '4px',
      },
      boxShadow: {
        gum: '4px 4px 0px 0px rgba(0,0,0,1)',
        'gum-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'gum-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};
