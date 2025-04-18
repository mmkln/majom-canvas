// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
  base: '/majom-canvas/',
  // Specify the project root (where index.html is located)
  root: 'src',
  build: {
    // Output the production build in a folder outside of app
    outDir: '../dist',
    // Empty out the output directory before building
    emptyOutDir: true,
  },
  plugins: [
    tailwindcss(),
  ]
});
