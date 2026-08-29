import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { ToggleButton } from './toggle-button';
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta = {
  title: 'Components/Button family/ToggleButton',
  component: ToggleButton,
  args: { children: 'Pin' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ToggleButton',
        description: 'Controlled native pressed action.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.toggleButton,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;
const row = { display: 'flex', gap: 12 } as const;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: () => <ToggleButton pressed>Pin</ToggleButton>,
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div style={row}>
      <ToggleButton>Default</ToggleButton>
      <ToggleButton pressed>Pressed</ToggleButton>
      <ToggleButton disabled>Disabled</ToggleButton>
    </div>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <ToggleButton pressed aria-describedby="pin-help">
      Pin
    </ToggleButton>
  ),
};
