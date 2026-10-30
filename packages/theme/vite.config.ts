import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        'layer-order': resolve(import.meta.dirname, 'src/layer-order.ts'),
        seeds: resolve(import.meta.dirname, 'src/seeds.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: { output: { entryFileNames: '[name].js' } },
  },
});
