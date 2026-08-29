import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ChevronDown, Redo2, Save, Trash2, Undo2 } from 'lucide-react';

import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { IconButton } from './icon-button';

const demoIcons = {
  'chevron-down': ChevronDown,
  redo: Redo2,
  save: Save,
  trash: Trash2,
  undo: Undo2,
} as const;

function DemoIcon({ name }: { name: keyof typeof demoIcons }) {
  const Icon = demoIcons[name];
  return <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Button family/ButtonGroup',
  component: ButtonGroup,
  args: {
    'aria-label': 'Editing history',
    children: (
      <>
        <IconButton aria-label="Undo" tone="neutral" variant="outline">
          <DemoIcon name="undo" />
        </IconButton>
        <IconButton aria-label="Redo" tone="neutral" variant="outline">
          <DemoIcon name="redo" />
        </IconButton>
      </>
    ),
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonGroup',
        description: 'Related controls share geometry while keeping their own native semantics.',
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
    <div className="slotted-demo-grid">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Horizontal toolbar</span>
          <span className="slotted-demo-scene__note">Compact icon actions share one outline.</span>
        </header>
        <div className="slotted-demo-stage">
          <ButtonGroup aria-label="Editing history">
            <IconButton aria-label="Undo" tone="neutral" variant="outline">
              <DemoIcon name="undo" />
            </IconButton>
            <IconButton aria-label="Redo" tone="neutral" variant="outline">
              <DemoIcon name="redo" />
            </IconButton>
            <IconButton aria-label="Delete" tone="neutral" variant="outline">
              <DemoIcon name="trash" />
            </IconButton>
          </ButtonGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Vertical actions</span>
          <span className="slotted-demo-scene__note">A stacked set keeps its edge treatment.</span>
        </header>
        <div className="slotted-demo-stage">
          <ButtonGroup aria-label="Document actions" orientation="vertical">
            <Button leading={<DemoIcon name="save" />} tone="neutral" variant="outline">
              Save draft
            </Button>
            <Button tone="neutral" variant="outline">
              Duplicate
            </Button>
          </ButtonGroup>
        </div>
      </section>
    </div>
  ),
};

export const SplitAction: Story = {
  parameters: scenario('splitAction'),
  render: () => (
    <div className="slotted-demo-stage">
      <ButtonGroup aria-label="Publish actions" className="slotted-split-action">
        <Button leading={<DemoIcon name="save" />} size="md" tone="accent" variant="solid">
          Publish
        </Button>
        <IconButton aria-label="More publish options" size="md" tone="accent" variant="solid">
          <DemoIcon name="chevron-down" />
        </IconButton>
      </ButtonGroup>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <ButtonGroup aria-label="Editing history">
      <IconButton aria-label="Undo" tone="neutral" variant="outline">
        <DemoIcon name="undo" />
      </IconButton>
      <IconButton aria-label="Redo" tone="neutral" variant="outline">
        <DemoIcon name="redo" />
      </IconButton>
    </ButtonGroup>
  ),
};
