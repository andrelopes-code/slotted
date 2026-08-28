import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';
import '@slotted/react/styles.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  initialGlobals: { theme: 'default', scheme: 'light', density: 'comfortable' },
  globalTypes: {
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
  },
  decorators: [
    (Story, context) => {
      const { density, scheme, theme } = context.globals;

      return (
        <div
          data-slotted-theme={theme}
          data-slotted-scheme={scheme}
          data-slotted-density={density}
          style={{
            minHeight: '100vh',
            padding: 24,
            background: scheme === 'dark' ? '#111827' : '#f8fafc',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
