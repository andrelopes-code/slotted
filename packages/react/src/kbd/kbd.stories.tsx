import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd } from './kbd';
import { REACT_KBD_DOCS, REACT_KBD_TOKENS } from './kbd.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Kbd',
        description: 'One key of a keyboard shortcut, printed.',
        framework: 'React',
        ...REACT_KBD_DOCS.kbd,
        tokens: REACT_KBD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'K', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Kbd {...args} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      {(['sm', 'md'] as const).map((size) => (
        <section className="slotted-demo-scene" key={size}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{size}</span>
            <span className="slotted-demo-scene__note">
              A single key is square; a word-length key grows sideways only.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              <Kbd size={size}>K</Kbd>
              <Kbd size={size}>W</Kbd>
              <Kbd size={size}>Shift</Kbd>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <span>
          <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> opens the command palette.
        </span>
        <span>
          <Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> does the same on macOS.
        </span>
        <p>
          The separator is text between two elements, not something the component prints. It is
          different in different languages, and the order of modifiers is different on different
          platforms.
        </p>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <button aria-keyshortcuts="Control+K" type="button">
          Search <Kbd size="sm">Ctrl</Kbd> <Kbd size="sm">K</Kbd>
        </button>
        <p>
          The shortcut is announced by aria-keyshortcuts on the control that responds to it. The
          printed keys are the picture of the shortcut, and a glyph key carries a name of its own
          because a screen reader would otherwise read the character.
        </p>
      </div>
    </div>
  ),
};
