import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBadge } from './badge';
import type { BadgeFill, BadgeSize, BadgeVariant } from './badge';
import { ANGULAR_BADGE_DOCS, ANGULAR_BADGE_TOKENS } from './badge.docs';

interface BadgeStoryArgs {
  content: string;
  fill: BadgeFill;
  size: BadgeSize;
  variant: BadgeVariant;
}

const VARIANTS = ['accent', 'secondary', 'success', 'warning', 'danger'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta: Meta<BadgeStoryArgs> = {
  title: 'Components/Badge',
  component: SlBadge,
  decorators: [moduleMetadata({ imports: [SlBadge] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Badge',
        description: 'A short status or count, painted in one of the library tones.',
        framework: 'Angular',
        ...ANGULAR_BADGE_DOCS.badge,
        tokens: ANGULAR_BADGE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

export const Playground: Story = {
  args: { content: 'Paid', fill: 'solid', size: 'md', variant: 'secondary' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slBadge [fill]="fill" [size]="size" [variant]="variant">{{ content }}</span>
  </div>
</div>`,
  }),
};

const fillScene = (fill: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${fill}</span>
      <span class="slotted-demo-scene__note">The five tones the library names, in one fill.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        ${VARIANTS.map(
          (variant) => `<span slBadge fill="${fill}" variant="${variant}">${variant}</span>`,
        ).join('\n        ')}
      </div>
    </div>
  </section>`;

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${fillScene('solid')}
  ${fillScene('outline')}
  ${fillScene('subtle')}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">sm</span>
      <span class="slotted-demo-scene__note">Beside text, inside a dense row.</span>
    </header>
    <div class="slotted-demo-stage">
      <span>INV-0042 <span slBadge size="sm" variant="success">Paid</span></span>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">md</span>
      <span class="slotted-demo-scene__note">On its own, as a heading's companion.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slBadge variant="success">Paid</span>
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
      <strong>Quarterly report</strong>
      <span slBadge fill="outline" size="sm" variant="warning">Draft</span>
    </div>
    <div class="slotted-demo-row">
      <span>Unread</span>
      <span slBadge size="sm" variant="danger" aria-label="3 unread messages">3</span>
    </div>
    <p>
      The count carries an accessible name of its own, because &ldquo;3&rdquo; on its own tells a
      screen reader user nothing about what there are three of.
    </p>
  </div>
</div>`,
  }),
};
