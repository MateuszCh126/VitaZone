/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)'
      },
      borderRadius: { card: 'var(--surface-radius)' },
      boxShadow: {
        glow: '0 0 22px rgb(var(--color-primary) / 0.10)',
        surface: '0 12px 30px rgb(0 0 0 / 0.24)'
      },
      transitionDuration: { quick: 'var(--motion-fast)', standard: 'var(--motion-standard)' },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};
