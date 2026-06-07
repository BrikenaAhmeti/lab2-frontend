/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        med: {
          50: '#EBF9FB',
          100: '#D5F3F8',
          200: '#B1E8F1',
          300: '#7BD8E8',
          400: '#40C1D8',
          500: '#20A9C6',
          600: '#1687A8',
          700: '#156B8A',
          800: '#18566F',
          900: '#19495E',
        },
        cobalt: {
          50: '#EBF4FF',
          100: '#D6E8FF',
          200: '#B3D4FF',
          300: '#7FB6FF',
          400: '#4B92FF',
          500: '#2B74F5',
          600: '#1E5DD9',
          700: '#1B4CB0',
          800: '#1B3F8D',
          900: '#1B366F',
        },
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 12px 32px -18px rgba(15, 23, 42, 0.35)',
        panel: '0 10px 24px -16px rgba(21, 90, 128, 0.45)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
