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
          900: '#253A80', // darkest
          800: '#3652B3',
          700: '#4A6DFF', // DEFAULT, main blue
          600: '#6C8CFF',
          500: '#A2BFFF', // lightest
          DEFAULT: '#4A6DFF', // Replit blue
          foreground: '#FFFFFF',
        },
        destructive: {
          900: '#991B1B',
          800: '#B91C1C',
          700: '#FF4B4B', // DEFAULT, main red
          600: '#FF7B7B',
          500: '#FFC1C1',
          DEFAULT: '#FF4B4B', // Replit red
          foreground: '#FFFFFF',
        },
        secondary: {
          900: '#A3A3A3',
          800: '#C5C5C5',
          700: '#E5E5E5',
          600: '#F5F6FA', // DEFAULT, main gray
          foreground: '#232323',
        },
        accent: {
          900: '#7B5E13',
          800: '#B28A1C',
          700: '#FFCB6B', // DEFAULT, main yellow
          600: '#FFE9B3',
          foreground: '#232323',
        },
        input: '#E3E3E3', // light border
        background: '#232323', // dark bg
        'destructive-foreground': '#FFFFFF',
        'primary-foreground': '#FFFFFF',
        'secondary-foreground': '#232323',
        'accent-foreground': '#232323',
        'muted-foreground': '#A0A0A0', // neutral gray for muted text
        ring: '#4A6DFF',
      },
    },
  },
  plugins: [],
};
