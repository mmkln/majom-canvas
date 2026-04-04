/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: 'var(--interactive-primary-active)',
          800: 'var(--interactive-primary-active)',
          700: 'var(--interactive-primary)', // DEFAULT, main interactive
          600: 'var(--interactive-primary-hover)',
          500: 'var(--interactive-primary-hover)',
          DEFAULT: 'var(--interactive-primary)',
          foreground: 'var(--text-inverse)',
        },
        destructive: {
          900: 'var(--status-danger-active)',
          800: 'var(--status-danger-active)',
          700: 'var(--status-danger)', // DEFAULT, danger role
          600: 'var(--status-danger-hover)',
          500: 'var(--status-danger-hover)',
          DEFAULT: 'var(--status-danger)',
          foreground: 'var(--text-inverse)',
        },
        secondary: {
          900: 'var(--border-strong)',
          800: 'var(--border-default)',
          700: 'var(--interactive-secondary)',
          600: 'var(--surface-muted)', // DEFAULT, muted surface
          foreground: 'var(--text-primary)',
        },
        accent: {
          900: 'var(--status-warning)',
          800: 'var(--status-warning)',
          700: 'var(--status-warning)', // DEFAULT, warning role
          600: 'var(--status-warning)',
          foreground: 'var(--text-primary)',
        },
        input: 'var(--border-default)',
        background: 'var(--surface-canvas)',
        foreground: 'var(--text-primary)',
        card: 'var(--surface-base)',
        border: 'var(--border-default)',
        'destructive-foreground': 'var(--text-inverse)',
        'primary-foreground': 'var(--text-inverse)',
        'secondary-foreground': 'var(--text-primary)',
        'accent-foreground': 'var(--text-primary)',
        'muted-foreground': 'var(--text-muted)',
        ring: 'var(--border-focus)',
      },
    },
  },
  plugins: [],
};
