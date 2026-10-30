import type { StorybookConfig } from '@storybook/react-vite';

// @ts-expect-error -- build tooling, resolved by Node rather than by the app's tsconfig
import { coreSourceAliases } from '../../../scripts/source-aliases.mjs';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../../../packages/react/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  docs: { defaultName: 'Reference' },
  typescript: { reactDocgen: 'react-docgen' },
  /**
   * `@slotted/core` publishes `dist`, which is right for a consumer and wrong
   * here: a change under `packages/core/src` would stay invisible until the
   * package was rebuilt. The stories already read every other package from
   * source, and this makes core the same.
   */
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...(Array.isArray(viteConfig.resolve?.alias) ? viteConfig.resolve.alias : []),
        ...coreSourceAliases(),
      ],
    },
  }),
};

export default config;
