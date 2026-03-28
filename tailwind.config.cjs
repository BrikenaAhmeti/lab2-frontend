/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F3EA',
          100: '#CCE7D5',
          200: '#99CFAA',
          300: '#66B780',
          400: '#339F55',
          500: '#00872B',
          600: '#006E23',
          700: '#00541A',
          800: '#003B12',
          900: '#00330F',
        },
        bg: {
          light: '#ffffff',
          dark: '#2a2a2a',
          darkSecondary: '#000000',
          grayPrimary: '#F5F5F5',
          graySecondary: '#FAFAFA',
          grayDark: '#E9EAEB',
          primary: '#00330F',
        },
        tx: {
          light: '#101010',
          dark: '#f9fafb',
          primary: '#00330F',
          secondary: '#717680',
        },
        bd: {
          light: '#00330F',
          dark: '#10B981',
          default: '#E9EAEB',
          graySecondary: '#717680',
          darkDefault: '#ffffff',
        },
        success: '#10B981',
        warning: '#F59E0B',
        attention: '#DC6803',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};
