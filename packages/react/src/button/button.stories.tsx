import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ChevronDown, Save } from 'lucide-react';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { Button } from './button';

function DemoIcon({ name }: { name: 'chevron-down' | 'save' }) {
  const Icon = name === 'save' ? Save : ChevronDown;
  return <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />;
}
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
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      <div className="slotted-demo-row">
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button loading loadingText="Saving">
          Save
        </Button>
      </div>
    </div>
  ),
};
export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Button leading={<DemoIcon name="save" />} trailing={<DemoIcon name="chevron-down" />}>
      Save
    </Button>
  ),
};
export const FullWidth: Story = {
  parameters: scenario('fullWidth'),
  render: () => (
    <div className="slotted-demo-measure">
      <Button fullWidth leading={<DemoIcon name="save" />}>
        Full width action
      </Button>
    </div>
  ),
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
