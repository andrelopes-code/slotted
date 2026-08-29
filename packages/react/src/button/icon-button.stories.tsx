import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { IconButton } from './icon-button';
const Icon = () => <span aria-hidden="true" className="slotted-demo-icon" data-icon="plus" />;
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta = {
  title: 'Components/Button family/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Add', children: <Icon /> },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'IconButton',
        description: 'Named icon-only native action.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.iconButton,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-row">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <IconButton aria-label={`Add ${size}`} key={size} size={size}>
          <Icon />
        </IconButton>
      ))}
    </div>
  ),
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-row">
      <IconButton aria-label="Default">
        <Icon />
      </IconButton>
      <IconButton aria-label="Disabled" disabled>
        <Icon />
      </IconButton>
    </div>
  ),
};
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <IconButton aria-label="Saving" loading>
      <Icon />
    </IconButton>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <IconButton aria-label="Add item">
      <Icon />
    </IconButton>
  ),
};
