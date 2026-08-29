import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';
import '@slotted/react/styles.css';
import '@slotted/storybook-workbench/styles.css';

import type { Preview } from '@storybook/react-vite';
import {
  GLOBAL_TYPES,
  INITIAL_GLOBALS,
  resolveWorkbenchGlobals,
} from '@slotted/storybook-workbench';

const preview: Preview = {
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    (Story, context) => {
      const values = resolveWorkbenchGlobals(context?.globals);
      const className = [
        'slotted-workbench-preview',
        context?.viewMode === 'docs' ? 'slotted-workbench-preview--embedded' : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div
          className={className}
          data-slotted-theme={values.theme}
          data-slotted-scheme={values.scheme}
          data-slotted-density={values.density}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    a11y: { test: 'off' },
    controls: { expanded: false },
    docs: { source: { state: 'none' }, toc: true },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Components',
          [
            'Button family',
            ['Overview', 'Button', 'ButtonLink', 'IconButton', 'ToggleButton', 'ButtonGroup'],
          ],
        ],
      },
    },
  },
};

export default preview;
