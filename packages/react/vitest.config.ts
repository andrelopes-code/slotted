import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// @ts-expect-error -- build tooling, resolved by Node rather than by the package tsconfig
import { coreSourceAliases } from '../../scripts/source-aliases.mjs';

export default defineConfig({
  plugins: [react()],
  /* The suite exercises the source of this package, so it exercises the source
     of core too. Reading `dist` made a test fail against arithmetic that had
     already been fixed, which is a false negative nobody can debug. */
  resolve: { alias: coreSourceAliases() },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      /* Focus and layout, which jsdom does not compute, run in
         Chromium: `*.browser.test.tsx`. */
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          /* Frame budgets: `vitest.perf.config.ts`. */
          exclude: ['src/**/*.perf.browser.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.browser.ts'],
          browser: {
            enabled: true,
            headless: true,
            /* A phone's viewport, the page and the test frame the same size,
               so a point in the test is a point for the input domain. */
            provider: playwright({
              contextOptions: { hasTouch: true, viewport: { width: 412, height: 915 } },
            }),
            instances: [{ browser: 'chromium' }],
            viewport: { width: 412, height: 915 },
          },
        },
      },
    ],
  },
});
