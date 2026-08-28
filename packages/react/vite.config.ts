import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      cssFileName: 'styles',
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        button: resolve(import.meta.dirname, 'src/button/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
