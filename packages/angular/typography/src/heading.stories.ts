import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlHeading } from './heading';
import { SlHeadingLevel } from './heading-level';
import { SlText } from './text';
import { ANGULAR_TYPOGRAPHY_DOCS, ANGULAR_TYPOGRAPHY_TOKENS } from './typography.docs';
import type { TypographySize } from './typography';

interface HeadingStoryArgs {
  content: string;
  size: TypographySize | undefined;
}

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Levels as never,
});

const meta: Meta<HeadingStoryArgs> = {
  title: 'Components/Heading',
  component: SlHeading,
  decorators: [moduleMetadata({ imports: [SlHeading, SlHeadingLevel, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Heading',
        description: 'A rank in the document outline, and a size on the page.',
        framework: 'Angular',
        ...ANGULAR_TYPOGRAPHY_DOCS.heading,
        tokens: ANGULAR_TYPOGRAPHY_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<HeadingStoryArgs>;

export const Playground: Story = {
  args: { content: 'Billing and invoices for the current workspace', size: undefined },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <h2 slHeading [size]="size">{{ content }}</h2>
</div>`,
  }),
};

export const Levels: Story = {
  parameters: scenario('levels'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Rank and size</span>
      <span class="slotted-demo-scene__note">
        The size follows the rank until it is asked for separately. The last row is a second rank
        that reads at body size.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        ${LEVELS.map((level) => `<h${level} slHeading>Level ${level}</h${level}>`).join('\n        ')}
        <h2 slHeading size="md">Level 2, at the body size</h2>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Hierarchy: Story = {
  parameters: scenario('hierarchy'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <h1 slHeading>Billing</h1>
    <span slText size="sm" tone="muted">No section around it, so this is the first rank.</span>
    <section slHeadingLevel class="slotted-demo-stack">
      <h2 slHeading>Invoices</h2>
      <span slText size="sm" tone="muted">
        One section deeper. The section states the rank it expects, and the heading matches it.
      </span>
      <section slHeadingLevel class="slotted-demo-stack">
        <h3 slHeading>History</h3>
        <span slText size="sm" tone="muted">
          Two deep. A tag deeper than the section allows is reported in development rather than
          corrected.
        </span>
      </section>
    </section>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <h2 slHeading id="payment-method">Payment method</h2>
    <p slText size="sm" tone="muted">
      The rank is the element the template wrote, so the outline a screen reader announces is the
      one the page has. The identifier is a native attribute, which is what an anchor needs.
    </p>
    <h3 slHeading size="sm" transform="uppercase">A quiet third rank</h3>
    <p slText size="sm" tone="muted">
      Size and rank are separate: a heading may read quietly and still hold its place in the
      outline.
    </p>
  </div>
</div>`,
  }),
};
