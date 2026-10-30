import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDivider } from './divider';
import type { DividerAlign, DividerOrientation } from './divider';
import { ANGULAR_DIVIDER_DOCS, ANGULAR_DIVIDER_TOKENS } from './divider.docs';

interface DividerStoryArgs {
  align: DividerAlign;
  decorative: boolean;
  inset: boolean;
  orientation: DividerOrientation;
}

/**
 * A menu is not a family yet, so the surface it needs is written here. The
 * inline padding is the control padding the inset reads, which is what lines
 * the rule up with the text of the items at every density.
 */
const MENU = {
  background: 'var(--slotted-surface-raised)',
  border: 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  'border-radius': 'var(--slotted-radius-md)',
  display: 'grid',
  gap: 'var(--slotted-space-1)',
  'inline-size': '100%',
  'list-style': 'none',
  margin: '0',
  'padding-block': 'var(--slotted-space-2)',
  'padding-inline': '0',
};

const MENU_ITEM = {
  'padding-block': 'var(--slotted-space-2)',
  'padding-inline': 'var(--slotted-control-padding-inline-md)',
};

const MENU_LABELLED = { 'padding-block': 'var(--slotted-space-2)' };

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<DividerStoryArgs> = {
  title: 'Components/Divider',
  component: SlDivider,
  decorators: [moduleMetadata({ imports: [SlDivider] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Divider',
        description: 'A rule between two regions, announced as a separator or kept silent.',
        framework: 'Angular',
        ...ANGULAR_DIVIDER_DOCS.divider,
        tokens: ANGULAR_DIVIDER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DividerStoryArgs>;

export const Playground: Story = {
  args: { align: 'center', decorative: false, inset: false, orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <p>Invoices are issued on the first working day of the month.</p>
    <hr slDivider [decorative]="decorative" [inset]="inset" [orientation]="orientation" />
    <p>Payment is due within thirty days.</p>
  </div>
</div>`,
  }),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Horizontal</span>
      <span class="slotted-demo-scene__note">Fills the inline size of its container.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack" style="inline-size: 100%">
        <span>Billing</span>
        <hr slDivider />
        <span>Members</span>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Vertical</span>
      <span class="slotted-demo-scene__note">Takes the height of the row, and one line of text when the row gives it none.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row" style="inline-size: 100%">
        <span>Draft</span>
        <hr slDivider orientation="vertical" />
        <span>Sent</span>
        <hr slDivider orientation="vertical" />
        <span>Paid</span>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Inset</span>
      <span class="slotted-demo-scene__note">Stops short of both ends, so it lines up with the text of a list rather than the edge of its container.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack" style="inline-size: 100%">
        <span>Export as CSV</span>
        <hr slDivider inset />
        <span>Export as PDF</span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Label: Story = {
  parameters: scenario('label'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <p>Continue with a single sign-on provider.</p>
    <div slDivider label="Or"></div>
    <p>Sign in with an email address and a password.</p>
    <div slDivider align="start" label="Archived workspaces"></div>
    <p>
      A label at one end keeps one half of the rule. The label is the rule's accessible name, so a
      screen reader announces the division and the words that qualify it once.
    </p>
    <div slDivider align="end" label="Updated 12 minutes ago"></div>
  </div>
</div>`,
  }),
};

export const Decorative: Story = {
  parameters: scenario('decorative'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Announced</span>
      <span class="slotted-demo-scene__note">A separator: the rule marks where one topic ends.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack" style="inline-size: 100%">
        <p>Terms of service</p>
        <hr slDivider />
        <p>Privacy notice</p>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Silent</span>
      <span class="slotted-demo-scene__note">role="none": the heading already says where the section starts.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack" style="inline-size: 100%">
        <h3>Members</h3>
        <hr slDivider decorative />
        <p>Four people have access to this workspace.</p>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { menu: MENU, menuItem: MENU_ITEM, menuLabelled: MENU_LABELLED },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div class="slotted-demo-row">
      <strong>Acme Inc.</strong>
      <hr slDivider decorative orientation="vertical" />
      <span>Workspace settings</span>
    </div>
    <p>
      An hr cannot stand inside a list, so the rule between two groups of menu items is written on
      the li the list needs. The element changes; what it means does not.
    </p>
    <ul role="menu" [style]="menu">
      <li role="menuitem" [style]="menuItem">Rename</li>
      <li role="menuitem" [style]="menuItem">Duplicate</li>
      <li slDivider inset></li>
      <li role="menuitem" [style]="menuItem">Export</li>
      <li slDivider align="start" inset label="Danger zone" [style]="menuLabelled"></li>
      <li role="menuitem" [style]="menuItem">Delete</li>
    </ul>
  </div>
</div>`,
  }),
};
