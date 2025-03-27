// vite.config.ts
// @ts-ignore
import { defineConfig } from 'vite';

export default defineConfig({
  // Specify the project root (where index.html is located)
  root: 'src',
  build: {
    // Output the production build in a folder outside of app
    outDir: '../dist',
    // Empty out the output directory before building
    emptyOutDir: true,
  }
});
