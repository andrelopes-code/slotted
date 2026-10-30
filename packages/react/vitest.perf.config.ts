import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// @ts-expect-error -- build tooling, resolved by Node rather than by the package tsconfig
import { coreSourceAliases } from '../../scripts/source-aliases.mjs';

/**
 * Frame budgets, `*.perf.browser.test.tsx`, measured against React's
 * production build, which is what ships: the development build's checks cost
 * more than the budget itself. A configuration and a process of their own,
 * because `process.env.NODE_ENV` defined in one project of a run reaches
 * every project in it.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { alias: coreSourceAliases() },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  cacheDir: 'node_modules/.vite/perf',
  test: {
    include: ['src/**/*.perf.browser.test.{ts,tsx}'],
    /* One file at a time: a Chrome trace is one per browser, and two files
       tracing at once refuse the second; a budget measured beside another
       file's work measures both. */
    fileParallelism: false,
    setupFiles: ['./src/test/setup.perf.ts'],
    browser: {
      enabled: true,
      headless: true,
      /* A phone's viewport, the page and the test frame the same size, so a
         point in the test is a point for the input domain. */
      provider: playwright({
        contextOptions: { hasTouch: true, viewport: { width: 412, height: 915 } },
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 412, height: 915 },
    },
  },
});
