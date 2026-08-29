import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';

import { componentWrapperDecorator } from '@storybook/angular-vite';
import type { Preview } from '@storybook/angular-vite';
import {
  GLOBAL_TYPES,
  INITIAL_GLOBALS,
  resolveWorkbenchGlobals,
} from '@slotted/storybook-workbench';
import '@slotted/storybook-workbench/styles.css';

const preview: Preview = {
  initialGlobals: INITIAL_GLOBALS,
  globalTypes: GLOBAL_TYPES,
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="slotted-workbench-preview" [attr.data-slotted-theme]="slottedTheme" [attr.data-slotted-scheme]="slottedScheme" [attr.data-slotted-density]="slottedDensity">${story}</div>`,
      (context) => {
        const values = resolveWorkbenchGlobals(context?.globals);
        return {
          slottedDensity: values.density,
          slottedScheme: values.scheme,
          slottedTheme: values.theme,
        };
      },
    ),
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
