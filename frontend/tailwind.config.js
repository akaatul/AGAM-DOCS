/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF0F5',
          100: '#FFD1DC', // Sweet pink
          200: '#FFBCD0',
          300: '#FFA7C4',
          400: '#FF92B8',
          500: '#FF8BA7', // Rose red
          600: '#FF6B95',
          700: '#FF4B83',
          800: '#FF2B71',
          900: '#FF0B5F',
        },
        secondary: {
          50: '#F5F0FF',
          100: '#E6E6FA', // Soft lavender
          200: '#D8D0FF',
          300: '#C9BBFF',
          400: '#BBA5FF',
          500: '#AC90FF',
          600: '#9D7AFF',
          700: '#8F65FF',
          800: '#804FFF',
          900: '#723AFF',
        },
        accent: {
          50: '#FFFBEA',
          100: '#FFF6D5',
          200: '#FFF1C0',
          300: '#FFECAB',
          400: '#FFE796',
          500: '#FFE281',
          600: '#FFDD6C',
          700: '#FFD857',
          800: '#FFD342',
          900: '#FFD700', // Golden accent
        },
      },
      borderRadius: {
        'hexagon': '24px',
        'heart': '50% 50% 0 0 / 40% 40% 0 0',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'flutter': 'flutter 5s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'rotate-slow': 'rotate 10s linear infinite',
        'fall': 'fall 10s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '40%': { transform: 'scale(1)' },
          '60%': { transform: 'scale(1.1)' },
        },
        flutter: {
          '0%, 100%': { transform: 'rotate(-3deg) translateY(0)' },
          '25%': { transform: 'rotate(3deg) translateY(-5px)' },
          '50%': { transform: 'rotate(-3deg) translateY(0)' },
          '75%': { transform: 'rotate(3deg) translateY(-5px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: 0, transform: 'scale(0)' },
          '50%': { opacity: 1, transform: 'scale(1)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fall: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: 0 },
          '10%': { opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: 0 },
        },
      },
      fontFamily: {
        'cursive': ['Pacifico', 'cursive'],
        'sans': ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 