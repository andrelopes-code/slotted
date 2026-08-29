import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, 'src/workbench.styles.test.mjs'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
