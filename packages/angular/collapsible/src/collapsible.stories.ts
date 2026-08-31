import { signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBadge } from '../../badge/src/badge';
import { SlCard } from '../../card/src/card';
import { SlCardBody } from '../../card/src/card-body';
import { SlCardHeader } from '../../card/src/card-header';
import { SlCollapsible } from './collapsible';
import { SlCollapsibleContent } from './collapsible-content';
import { SlCollapsibleTrigger } from './collapsible-trigger';
import { ANGULAR_COLLAPSIBLE_DOCS, ANGULAR_COLLAPSIBLE_TOKENS } from './collapsible.docs';

interface CollapsibleStoryArgs {
  open: boolean;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta<CollapsibleStoryArgs> = {
  title: 'Components/Collapsible',
  component: SlCollapsible,
  decorators: [
    moduleMetadata({
      imports: [
        SlBadge,
        SlCard,
        SlCardBody,
        SlCardHeader,
        SlCollapsible,
        SlCollapsibleContent,
        SlCollapsibleTrigger,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Collapsible',
        description: 'One region the reader can put away, built on the platform disclosure.',
        framework: 'Angular',
        ...ANGULAR_COLLAPSIBLE_DOCS.collapsible,
        tokens: ANGULAR_COLLAPSIBLE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CollapsibleStoryArgs>;

export const Playground: Story = {
  args: { open: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <details slCollapsible [open]="open">
    <summary slCollapsibleTrigger>Billing details</summary>
    <div slCollapsibleContent>
      Invoices are issued on the first working day of each month and are due within thirty days.
    </div>
  </details>
</div>`,
  }),
};

export const Open: Story = {
  parameters: scenario('open'),
  render: () => {
    const advanced = signal(false);
    return {
      props: { advanced },
      template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">One-way</span>
      <span class="slotted-demo-scene__note">[open] sets the starting state; the reader decides after.</span>
    </header>
    <div class="slotted-demo-stage">
      <details slCollapsible [open]="true">
        <summary slCollapsibleTrigger>What is included</summary>
        <div slCollapsibleContent>Five seats and unlimited invoices.</div>
      </details>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Two-way</span>
      <span class="slotted-demo-scene__note">[(open)] keeps a signal in step with the element.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <details slCollapsible [(open)]="advanced">
          <summary slCollapsibleTrigger>Advanced settings</summary>
          <div slCollapsibleContent>Two settings nobody changes.</div>
        </details>
        <p>The consumer holds the value: it is currently {{ advanced() ? 'open' : 'closed' }}.</p>
      </div>
    </div>
  </section>
</div>`,
    };
  },
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slCard>
    <div slCardHeader><strong>Invoice INV-0042</strong></div>
    <div slCardBody>
      <details slCollapsible>
        <summary slCollapsibleTrigger>
          Line items <span slBadge fill="subtle" size="sm" variant="secondary">3</span>
        </summary>
        <div slCollapsibleContent>
          <div class="slotted-demo-stack">
            <span>Design retainer &mdash; &pound;800.00</span>
            <span>Research &mdash; &pound;320.00</span>
            <span>Accessibility audit &mdash; &pound;120.00</span>
          </div>
        </div>
      </details>
    </div>
  </div>
  <p>
    The trigger holds a badge as well as its label, because a summary takes ordinary content.
  </p>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <details slCollapsible>
      <summary slCollapsibleTrigger>Terms nobody reads</summary>
      <div slCollapsibleContent>
        In a browser that supports it, the browser's own find-in-page will open this region to show
        a match inside it.
      </div>
    </details>
    <p>
      Tab reaches the trigger, and Enter or Space opens it. The library sets no aria-expanded and no
      aria-controls: the element already reports both, and an attribute the component maintained by
      hand is one that can fall out of step with what the browser did.
    </p>
  </div>
</div>`,
  }),
};
