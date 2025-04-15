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
          DEFAULT: '#4A6DFF', // Replit blue
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#FF4B4B', // Replit red
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F5F6FA', // Replit light gray
          foreground: '#232323',
        },
        accent: {
          DEFAULT: '#FFCB6B', // Replit yellow
          foreground: '#232323',
        },
        input: '#E3E3E3', // light border
        background: '#232323', // dark bg
        'destructive-foreground': '#FFFFFF',
        'primary-foreground': '#FFFFFF',
        'secondary-foreground': '#232323',
        'accent-foreground': '#232323',
        ring: '#4A6DFF',
      },
    },
  },
  plugins: [],
};
