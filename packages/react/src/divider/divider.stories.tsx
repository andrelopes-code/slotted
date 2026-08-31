import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './divider';
import { REACT_DIVIDER_DOCS, REACT_DIVIDER_TOKENS } from './divider.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Divider',
        description: 'A rule between two regions, announced as a separator or kept silent.',
        framework: 'React',
        ...REACT_DIVIDER_DOCS.divider,
        tokens: REACT_DIVIDER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { decorative: false, orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <p>Invoices are issued on the first working day of the month.</p>
        <Divider {...args} />
        <p>Payment is due within thirty days.</p>
      </div>
    </div>
  ),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Horizontal</span>
          <span className="slotted-demo-scene__note">Fills the inline size of its container.</span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <span>Billing</span>
            <Divider />
            <span>Members</span>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Vertical</span>
          <span className="slotted-demo-scene__note">Stretches to the height of a flex row.</span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <span>Draft</span>
            <Divider orientation="vertical" />
            <span>Sent</span>
            <Divider orientation="vertical" />
            <span>Paid</span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Decorative: Story = {
  parameters: scenario('decorative'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Announced</span>
          <span className="slotted-demo-scene__note">
            A separator: the rule marks where one topic ends.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <p>Terms of service</p>
            <Divider />
            <p>Privacy notice</p>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Silent</span>
          <span className="slotted-demo-scene__note">
            role=&quot;none&quot;: the heading already says where the section starts.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <h3>Members</h3>
            <Divider decorative />
            <p>Four people have access to this workspace.</p>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <div className="slotted-demo-row">
          <strong>Acme Inc.</strong>
          <Divider decorative orientation="vertical" />
          <span>Workspace settings</span>
        </div>
        <Divider />
        <p>
          A vertical rule inside a row of text and a horizontal rule between blocks read the same
          thickness token, so one theme decision governs both.
        </p>
      </div>
    </div>
  ),
};
