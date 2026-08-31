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
        avatar: resolve(import.meta.dirname, 'src/avatar/index.ts'),
        badge: resolve(import.meta.dirname, 'src/badge/index.ts'),
        button: resolve(import.meta.dirname, 'src/button/index.ts'),
        'description-list': resolve(import.meta.dirname, 'src/description-list/index.ts'),
        divider: resolve(import.meta.dirname, 'src/divider/index.ts'),
        field: resolve(import.meta.dirname, 'src/field/index.ts'),
        kbd: resolve(import.meta.dirname, 'src/kbd/index.ts'),
        link: resolve(import.meta.dirname, 'src/link/index.ts'),
        'progress-bar': resolve(import.meta.dirname, 'src/progress-bar/index.ts'),
        skeleton: resolve(import.meta.dirname, 'src/skeleton/index.ts'),
        spinner: resolve(import.meta.dirname, 'src/spinner/index.ts'),
        splitter: resolve(import.meta.dirname, 'src/splitter/index.ts'),
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
