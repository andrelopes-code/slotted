import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import type { StorybookConfig } from '@storybook/angular-vite';

const packageRoot = fileURLToPath(new URL('../../../packages/angular/', import.meta.url));

/**
 * One entry point may depend on another — `input` injects the field — and the
 * import must be written as `@slotted/angular/field` so ng-packagr resolves it
 * to a single class rather than compiling a second copy. Vite knows nothing of
 * that convention, so the same specifiers are aliased to the source the entry
 * point publishes.
 */
const entryPointAliases = () =>
  readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dist', 'node_modules', 'src'].includes(entry.name))
    .map((entry) => ({
      find: `@slotted/angular/${entry.name}`,
      replacement: join(packageRoot, entry.name, 'src/public-api.ts'),
    }));

const config: StorybookConfig = {
  framework: {
    name: '@storybook/angular-vite',
    options: {
      compodoc: true,
      tsconfig: '../../packages/angular/tsconfig.lib.json',
    },
  },
  stories: ['../../../packages/angular/*/src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  docs: { defaultName: 'Reference' },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...(Array.isArray(viteConfig.resolve?.alias) ? viteConfig.resolve.alias : []),
        ...entryPointAliases(),
      ],
    },
  }),
};

export default config;
