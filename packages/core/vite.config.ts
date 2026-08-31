import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        collection: resolve(import.meta.dirname, 'src/collection/index.ts'),
        files: resolve(import.meta.dirname, 'src/files/index.ts'),
        focus: resolve(import.meta.dirname, 'src/focus/index.ts'),
        measure: resolve(import.meta.dirname, 'src/measure/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: { output: { entryFileNames: '[name].js' } },
  },
});
