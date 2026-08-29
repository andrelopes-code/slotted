import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { IconButton } from './icon-button';
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});
const meta = {
  title: 'Components/Button family/ButtonGroup',
  component: ButtonGroup,
  args: {
    'aria-label': 'Editing actions',
    children: (
      <>
        <Button>Save</Button>
        <Button>Discard</Button>
      </>
    ),
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonGroup',
        description: 'Semantic grouping without child mutation.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.buttonGroup,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <>
      <ButtonGroup aria-label="Horizontal">
        <Button>Save</Button>
        <Button>Discard</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Vertical" orientation="vertical">
        <Button>Save</Button>
        <Button>Discard</Button>
      </ButtonGroup>
    </>
  ),
};
export const SplitAction: Story = {
  parameters: scenario('splitAction'),
  render: () => (
    <ButtonGroup aria-label="Save actions">
      <Button>Save</Button>
      <IconButton aria-label="More save options">⌄</IconButton>
    </ButtonGroup>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <ButtonGroup aria-label="Editing actions">
      <Button>Save</Button>
      <Button>Discard</Button>
    </ButtonGroup>
  ),
};
