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
        divider: resolve(import.meta.dirname, 'src/divider/index.ts'),
        field: resolve(import.meta.dirname, 'src/field/index.ts'),
        tabs: resolve(import.meta.dirname, 'src/tabs/index.ts'),
        'visually-hidden': resolve(import.meta.dirname, 'src/visually-hidden/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@slotted\/core/, 'react', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
