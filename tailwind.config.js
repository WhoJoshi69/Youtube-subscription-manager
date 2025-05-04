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
        'scale-fade': 'scale-fade 300ms ease-out forwards',
        'first': 'moveVertical 30s ease infinite',
        'second': 'moveInCircle 20s reverse infinite',
        'third': 'moveInCircle 40s linear infinite',
        'fourth': 'moveHorizontal 40s ease infinite',
        'fifth': 'moveInCircle 20s ease infinite',
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
        },
        moveHorizontal: {
          '0%': { transform: 'translateX(-50%) translateY(-10%)' },
          '50%': { transform: 'translateX(50%) translateY(10%)' },
          '100%': { transform: 'translateX(-50%) translateY(-10%)' },
        },
        moveInCircle: {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        moveVertical: {
          '0%': { transform: 'translateY(-50%)' },
          '50%': { transform: 'translateY(50%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
      borderRadius: {
        '2xl': '1rem', // You can adjust this value to make corners more or less rounded
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        '.dark': {
          color: theme('colors.white'),
        },
        '.dark input::placeholder': {
          color: theme('colors.gray.400'),
        },
        '.dark button': {
          color: theme('colors.white'),
        },
        // Exceptions for text that should not be white
        '.dark .text-red-600': {
          color: theme('colors.red.600'),
        },
        '.dark .text-gray-400': {
          color: theme('colors.gray.400'),
        },
        '.dark .text-gray-500': {
          color: theme('colors.gray.500'),
        },
      });
    },
  ],
};