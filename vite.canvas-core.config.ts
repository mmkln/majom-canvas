import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/canvas-core/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'packages/canvas-core/dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ['rxjs', 'uuid'],
    },
  },
});
