import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDivider } from './divider';
import type { DividerOrientation } from './divider';
import { ANGULAR_DIVIDER_DOCS, ANGULAR_DIVIDER_TOKENS } from './divider.docs';

interface DividerStoryArgs {
  decorative: boolean;
  orientation: DividerOrientation;
}

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
  args: { decorative: false, orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <p>Invoices are issued on the first working day of the month.</p>
    <hr slDivider [decorative]="decorative" [orientation]="orientation" />
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
      <div class="slotted-demo-stack">
        <span>Billing</span>
        <hr slDivider />
        <span>Members</span>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Vertical</span>
      <span class="slotted-demo-scene__note">Stretches to the height of a flex row.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        <span>Draft</span>
        <hr slDivider orientation="vertical" />
        <span>Sent</span>
        <hr slDivider orientation="vertical" />
        <span>Paid</span>
      </div>
    </div>
  </section>
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
      <div class="slotted-demo-stack">
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
      <div class="slotted-demo-stack">
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
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div class="slotted-demo-row">
      <strong>Acme Inc.</strong>
      <hr slDivider decorative orientation="vertical" />
      <span>Workspace settings</span>
    </div>
    <hr slDivider />
    <p>
      A vertical rule inside a row of text and a horizontal rule between blocks read the same
      thickness token, so one theme decision governs both.
    </p>
  </div>
</div>`,
  }),
};
