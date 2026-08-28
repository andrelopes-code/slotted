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
    componentWrapperDecorator(
      (story) =>
        `<div [attr.data-slotted-theme]="slottedTheme" [attr.data-slotted-scheme]="slottedScheme" [attr.data-slotted-density]="slottedDensity" [style.background]="slottedBackground" style="min-height:100vh;padding:24px">${story}</div>`,
      ({ globals }) => {
        const scheme = globals['scheme'] ?? 'light';

        return {
          slottedBackground: scheme === 'dark' ? '#111827' : '#f8fafc',
          slottedDensity: globals['density'] ?? 'comfortable',
          slottedScheme: scheme,
          slottedTheme: globals['theme'] ?? 'default',
        };
      },
    ),
  ],
  parameters: {
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
