import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/angular-vite',
    options: {
      compodoc: true,
      tsconfig: '../../packages/angular/tsconfig.lib.json',
    },
  },
  stories: ['../../../packages/angular/button/src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  docs: { defaultName: 'Reference' },
};

export default config;
