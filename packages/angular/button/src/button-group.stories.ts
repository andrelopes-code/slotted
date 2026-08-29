import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlButton } from './button';
import { SlButtonGroup } from './button-group';
import { SlIconButton } from './icon-button';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});
const meta: Meta = {
  title: 'Components/Button family/ButtonGroup',
  component: SlButtonGroup,
  decorators: [moduleMetadata({ imports: [SlButton, SlButtonGroup, SlIconButton] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonGroup',
        description: 'Semantic grouping without child mutation.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.buttonGroup,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: () => ({
    template:
      '<div slButtonGroup aria-label="Editing actions"><button slButton>Save</button><button slButton>Discard</button></div>',
  }),
};
export default meta;
type Story = StoryObj;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template:
      '<div style="display:grid;gap:12px"><div slButtonGroup aria-label="Horizontal"><button slButton>Save</button><button slButton>Discard</button></div><div slButtonGroup aria-label="Vertical" orientation="vertical"><button slButton>Save</button><button slButton>Discard</button></div></div>',
  }),
};
export const SplitAction: Story = {
  parameters: scenario('splitAction'),
  render: () => ({
    template:
      '<div slButtonGroup aria-label="Save actions"><button slButton>Save</button><button slIconButton aria-label="More save options">⌄</button></div>',
  }),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      '<div slButtonGroup aria-label="Editing actions"><button slButton>Save</button><button slButton>Discard</button></div>',
  }),
};
