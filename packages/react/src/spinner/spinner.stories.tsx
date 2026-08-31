import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from './spinner';
import { REACT_SPINNER_DOCS, REACT_SPINNER_TOKENS } from './spinner.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Spinner',
        description: 'An indeterminate wait, announced once and painted in the surrounding colour.',
        framework: 'React',
        ...REACT_SPINNER_DOCS.spinner,
        tokens: REACT_SPINNER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { decorative: false, label: 'Loading', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Spinner {...args} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <section className="slotted-demo-scene" key={size}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{size}</span>
            <span className="slotted-demo-scene__note">
              One token per size; the stroke stays constant.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <Spinner label={`Loading, ${size}`} size={size} />
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Inside a sentence</span>
          <span className="slotted-demo-scene__note">
            The ring takes the text colour and the text size.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <p style={{ color: 'var(--slotted-tone-accent-text)' }}>
            <Spinner decorative size="sm" /> Saving your changes
          </p>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Filling a region</span>
          <span className="slotted-demo-scene__note">
            The only content, so it announces the wait itself.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Spinner label="Loading invoices" size="lg" />
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Announced</span>
          <span className="slotted-demo-scene__note">
            role=&quot;status&quot;, with the label as hidden text.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Spinner label="Loading invoices" />
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Silent</span>
          <span className="slotted-demo-scene__note">
            The sentence already reports the wait, so the ring says nothing.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <p>
            <Spinner decorative size="sm" /> Loading invoices
          </p>
        </div>
      </section>
    </div>
  ),
};
