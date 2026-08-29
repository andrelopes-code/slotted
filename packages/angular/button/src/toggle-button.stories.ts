import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlToggleButton } from './toggle-button';

interface ToggleArgs {
  pressed: boolean;
}
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta: Meta<ToggleArgs> = {
  title: 'Components/Button family/ToggleButton',
  component: SlToggleButton,
  decorators: [moduleMetadata({ imports: [SlToggleButton] })],
  args: { pressed: false },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ToggleButton',
        description: 'Controlled native pressed action.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.toggleButton,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: '<button slToggleButton [(pressed)]="pressed">Pin</button>',
  }),
};
export default meta;
type Story = StoryObj<ToggleArgs>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Pressed: Story = { parameters: scenario('pressed'), args: { pressed: true } };
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template:
      '<div style="display:flex;gap:12px"><button slToggleButton [(pressed)]="defaultPressed">Default</button><button slToggleButton [pressed]="true">Pressed</button><button slToggleButton disabled>Disabled</button></div>',
    props: { defaultPressed: false },
  }),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      '<button slToggleButton [pressed]="true" aria-describedby="pin-help">Pin</button><span class="slotted-visually-hidden" id="pin-help">Indicates whether the item is pinned.</span>',
  }),
};
