import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { Button } from './button';
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta = {
  title: 'Components/Button family/Button',
  component: Button,
  args: { children: 'Save changes' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Button',
        description: 'Native action control with controlled loading.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.button,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
const row = { display: 'flex', flexWrap: 'wrap', gap: 12 } as const;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div style={row}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};
export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Button
      leading={
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M3 8h10M8 3v10" />
        </svg>
      }
      trailing={<span aria-hidden="true">⌘S</span>}
    >
      Save
    </Button>
  ),
};
export const FullWidth: Story = {
  parameters: scenario('fullWidth'),
  render: () => <Button fullWidth>Full width action</Button>,
};
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Button loading loadingText="Saving">
      Save
    </Button>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <>
      <Button aria-describedby="save-help">Save</Button>
      <p id="save-help">Saves the current document.</p>
    </>
  ),
};
