import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';

import { Divider } from './divider';
import { REACT_DIVIDER_DOCS, REACT_DIVIDER_TOKENS } from './divider.docs';

/**
 * A menu is not a family yet, so the surface it needs is written here. The
 * inline padding is the control padding the inset reads, which is what lines
 * the rule up with the text of the items at every density.
 */
const MENU: CSSProperties = {
  background: 'var(--slotted-surface-raised)',
  border: 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  borderRadius: 'var(--slotted-radius-md)',
  display: 'grid',
  gap: 'var(--slotted-space-1)',
  inlineSize: '100%',
  listStyle: 'none',
  margin: 0,
  paddingBlock: 'var(--slotted-space-2)',
  paddingInline: 0,
};

const MENU_ITEM: CSSProperties = {
  paddingBlock: 'var(--slotted-space-2)',
  paddingInline: 'var(--slotted-control-padding-inline-md)',
};

const MENU_LABELLED: CSSProperties = { paddingBlock: 'var(--slotted-space-2)' };

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
  args: { align: 'center', decorative: false, inset: false, orientation: 'horizontal' },
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
          <div className="slotted-demo-stack" style={{ inlineSize: '100%' }}>
            <span>Billing</span>
            <Divider />
            <span>Members</span>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Vertical</span>
          <span className="slotted-demo-scene__note">
            Takes the height of the row, and one line of text when the row gives it none.
          </span>
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
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Inset</span>
          <span className="slotted-demo-scene__note">
            Stops short of both ends, so it lines up with the text of a list rather than the edge of
            its container.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack" style={{ inlineSize: '100%' }}>
            <span>Export as CSV</span>
            <Divider inset />
            <span>Export as PDF</span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Label: Story = {
  parameters: scenario('label'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <p>Continue with a single sign-on provider.</p>
        <Divider label="Or" />
        <p>Sign in with an email address and a password.</p>
        <Divider align="start" label="Archived workspaces" />
        <p>
          A label at one end keeps one half of the rule. The label is the rule&apos;s accessible
          name, so a screen reader announces the division and the words that qualify it once.
        </p>
        <Divider align="end" label="Updated 12 minutes ago" />
      </div>
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
          <div className="slotted-demo-stack" style={{ inlineSize: '100%' }}>
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
          <div className="slotted-demo-stack" style={{ inlineSize: '100%' }}>
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
        <p>
          An hr cannot stand inside a list, so the rule between two groups of menu items renders
          into the li the list needs. The element changes; what it means does not.
        </p>
        <ul role="menu" style={MENU}>
          <li role="menuitem" style={MENU_ITEM}>
            Rename
          </li>
          <li role="menuitem" style={MENU_ITEM}>
            Duplicate
          </li>
          <Divider inset render={(props) => <li {...props} />} />
          <li role="menuitem" style={MENU_ITEM}>
            Export
          </li>
          <Divider
            align="start"
            inset
            label="Danger zone"
            render={(props) => <li {...props} style={MENU_LABELLED} />}
          />
          <li role="menuitem" style={MENU_ITEM}>
            Delete
          </li>
        </ul>
      </div>
    </div>
  ),
};
