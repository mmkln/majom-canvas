// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredBase = env.VITE_APP_BASE?.trim();
  const base = configuredBase && configuredBase.length > 0 ? configuredBase : './';

  return {
    define: {
      __DEV_BUILD__: JSON.stringify(mode === 'development'),
    },
    // Default to relative assets so the same build works on
    // both custom domains and GitHub Pages project paths.
    base,
    // Keep env files in repo root even though Vite root is "src".
    envDir: '..',
    // Specify the project root (where index.html is located)
    root: 'src',
    build: {
      // Output the production build in a folder outside of app
      outDir: '../dist',
      // Empty out the output directory before building
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@majom/inkstone': fileURLToPath(
          new URL('./packages/inkstone/src/index.ts', import.meta.url)
        ),
      },
    },
    plugins: [tailwindcss()],
  };
});
