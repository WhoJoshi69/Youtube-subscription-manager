/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        red: {
          50: '#fff0f0',
          100: '#ffdddd',
          200: '#ffc0c0',
          300: '#ff9494',
          400: '#ff5757',
          500: '#ff2828',
          600: '#ff0000', // YouTube Red
          700: '#d70000',
          800: '#b10000',
          900: '#920000',
          950: '#500000',
        },
        gray: {
          800: '#1a1a1a', // Darker gray for dark mode
          900: '#0f0f0f', // Even darker
        },
        container: {
          center: true,
          padding: {
            DEFAULT: '1rem',
            sm: '2rem',
          },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
        'vanish-puff': 'vanish-puff 300ms ease-out forwards',
        'scale-fade': 'scale-fade 300ms ease-out forwards'
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'vanish-puff': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(1.2)',
            opacity: '0'
          }
        },
        'scale-fade': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(0.95)',
            opacity: '0'
          }
        }
      },
      borderRadius: {
        '2xl': '1rem', // You can adjust this value to make corners more or less rounded
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};