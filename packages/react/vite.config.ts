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
        alert: resolve(import.meta.dirname, 'src/alert/index.ts'),
        avatar: resolve(import.meta.dirname, 'src/avatar/index.ts'),
        badge: resolve(import.meta.dirname, 'src/badge/index.ts'),
        breadcrumb: resolve(import.meta.dirname, 'src/breadcrumb/index.ts'),
        button: resolve(import.meta.dirname, 'src/button/index.ts'),
        card: resolve(import.meta.dirname, 'src/card/index.ts'),
        collapsible: resolve(import.meta.dirname, 'src/collapsible/index.ts'),
        'description-list': resolve(import.meta.dirname, 'src/description-list/index.ts'),
        divider: resolve(import.meta.dirname, 'src/divider/index.ts'),
        field: resolve(import.meta.dirname, 'src/field/index.ts'),
        'file-upload': resolve(import.meta.dirname, 'src/file-upload/index.ts'),
        input: resolve(import.meta.dirname, 'src/input/index.ts'),
        kbd: resolve(import.meta.dirname, 'src/kbd/index.ts'),
        link: resolve(import.meta.dirname, 'src/link/index.ts'),
        'loading-bar': resolve(import.meta.dirname, 'src/loading-bar/index.ts'),
        pagination: resolve(import.meta.dirname, 'src/pagination/index.ts'),
        'progress-bar': resolve(import.meta.dirname, 'src/progress-bar/index.ts'),
        skeleton: resolve(import.meta.dirname, 'src/skeleton/index.ts'),
        spinner: resolve(import.meta.dirname, 'src/spinner/index.ts'),
        splitter: resolve(import.meta.dirname, 'src/splitter/index.ts'),
        stepper: resolve(import.meta.dirname, 'src/stepper/index.ts'),
        switch: resolve(import.meta.dirname, 'src/switch/index.ts'),
        tabs: resolve(import.meta.dirname, 'src/tabs/index.ts'),
        tag: resolve(import.meta.dirname, 'src/tag/index.ts'),
        textarea: resolve(import.meta.dirname, 'src/textarea/index.ts'),
        toolbar: resolve(import.meta.dirname, 'src/toolbar/index.ts'),
        'virtual-list': resolve(import.meta.dirname, 'src/virtual-list/index.ts'),
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
