import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Divider } from '../divider';
import { Toolbar } from './toolbar';
import { REACT_TOOLBAR_DOCS, REACT_TOOLBAR_TOKENS } from './toolbar.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toolbar',
        description: 'A group of controls that costs a keyboard user one Tab.',
        framework: 'React',
        ...REACT_TOOLBAR_DOCS.toolbar,
        tokens: REACT_TOOLBAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const formatting = (size: 'sm' = 'sm') => (
  <>
    <Button size={size} variant="secondary">
      Bold
    </Button>
    <Button disabled size={size} variant="secondary">
      Italic
    </Button>
    <Divider orientation="vertical" />
    <Button size={size} variant="secondary">
      Align left
    </Button>
    <Button size={size} variant="secondary">
      Align right
    </Button>
  </>
);

export const Playground: Story = {
  args: { orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Toolbar {...args} aria-label="Formatting">
        {formatting()}
      </Toolbar>
    </div>
  ),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">horizontal</span>
          <span className="slotted-demo-scene__note">Left and Right move between controls.</span>
        </header>
        <div className="slotted-demo-stage">
          <Toolbar aria-label="Horizontal formatting">{formatting()}</Toolbar>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">vertical</span>
          <span className="slotted-demo-scene__note">Up and Down do, and the rule turns.</span>
        </header>
        <div className="slotted-demo-stage">
          <Toolbar aria-label="Vertical formatting" orientation="vertical">
            {formatting()}
          </Toolbar>
        </div>
      </section>
    </div>
  ),
};

function GrowingToolbar() {
  const [extra, setExtra] = useState(false);

  return (
    <div className="slotted-demo-stack">
      <Toolbar aria-label="Growing toolbar">
        <Button size="sm" variant="secondary">
          Bold
        </Button>
        <Button size="sm" variant="secondary">
          Italic
        </Button>
        {extra ? (
          <Button size="sm" variant="secondary">
            Strikethrough
          </Button>
        ) : null}
      </Toolbar>
      <Button onClick={() => setExtra((current) => !current)} size="sm">
        {extra ? 'Remove the third control' : 'Add a third control'}
      </Button>
    </div>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Toolbar aria-label="Keyboard demonstration">{formatting()}</Toolbar>
        <ul>
          <li>Tab reaches the toolbar once, whatever it holds.</li>
          <li>Left and Right move between controls, and wrap past either end.</li>
          <li>Home and End go to the first and last control.</li>
          <li>Italic is disabled: the tab stop steps over it and does not stop there.</li>
          <li>Up and Down do nothing, so a scrollable page still scrolls.</li>
        </ul>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <GrowingToolbar />
      <p>
        The controls are ordinary Buttons, not something the toolbar wraps, and one added after the
        toolbar was built joins the single tab stop on its own.
      </p>
    </div>
  ),
};
