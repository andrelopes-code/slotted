import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';

import { componentWrapperDecorator } from '@storybook/angular-vite';
import type { Preview } from '@storybook/angular-vite';

const preview: Preview = {
  initialGlobals: { theme: 'default', scheme: 'light', density: 'comfortable' },
  globalTypes: {
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
  },
  decorators: [
    componentWrapperDecorator((story, context) => {
      const { density, scheme, theme } = context.globals;
      const background = scheme === 'dark' ? '#111827' : '#f8fafc';
      return `<div data-slotted-theme="${theme}" data-slotted-scheme="${scheme}" data-slotted-density="${density}" style="min-height:100vh;padding:24px;background:${background}">${story}</div>`;
    }),
  ],
  parameters: {
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
