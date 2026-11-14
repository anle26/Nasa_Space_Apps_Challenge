import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        missions: fileURLToPath(new URL('./index.html', import.meta.url)),
        dingoGap: fileURLToPath(new URL('./mars-explorer.html', import.meta.url)),
        marsExplorer: fileURLToPath(new URL('./mars/mars-explorer.html', import.meta.url)),
      },
    },
  },
});
