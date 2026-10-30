import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlInline } from './inline';
import { ANGULAR_INLINE_DOCS, ANGULAR_INLINE_TOKENS } from './inline.docs';
import type { InlineAlign, InlineGap, InlineJustify, InlineWrap } from './inline';

interface InlineStoryArgs {
  align?: InlineAlign;
  gap: InlineGap;
  justify?: InlineJustify;
  wrap?: InlineWrap;
}

/**
 * Inline paints nothing, so the reference page supplies the edges. The chip,
 * the caption and the frame are demonstration devices and never part of the
 * family.
 */
const demo = {
  chip: [
    'background: var(--slotted-surface-sunken)',
    'border: 1px solid var(--slotted-border-subtle)',
    'border-radius: var(--slotted-radius-full)',
    'font-size: 12px',
    'padding-block: var(--slotted-space-2)',
    'padding-inline: var(--slotted-space-4)',
  ].join('; '),
  caption: 'color: var(--slotted-text-muted); font-size: 11px',
  frame: [
    'border: 1px dashed var(--slotted-border-strong)',
    'border-radius: var(--slotted-radius-md)',
    'inline-size: 100%',
    'padding: var(--slotted-space-3)',
  ].join('; '),
  column: 'display: grid; gap: var(--slotted-space-8); grid-template-columns: minmax(0, 1fr)',
  row: 'display: grid; gap: var(--slotted-space-3); grid-template-columns: minmax(0, 1fr)',
  fill: 'inline-size: 100%',
};

const STATUSES = [
  'Overdue',
  'Awaiting review',
  'Paid in full',
  'Refunded',
  'Disputed',
  'Written off',
  'Partially settled',
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Separation as never,
});

const meta: Meta<InlineStoryArgs> = {
  title: 'Components/Inline',
  component: SlInline,
  decorators: [moduleMetadata({ imports: [SlInline] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Inline',
        description: 'Items along the inline axis, wrapping when the container runs out.',
        framework: 'Angular',
        ...ANGULAR_INLINE_DOCS.inline,
        tokens: ANGULAR_INLINE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<InlineStoryArgs>;

export const Playground: Story = {
  args: { gap: 4 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, demo },
    template: `
<div class="slotted-demo-stage" data-align="start">
  <div slInline [gap]="gap" [align]="align" [justify]="justify" [wrap]="wrap" [style]="demo.fill">
    <span [style]="demo.chip">Draft</span>
    <span [style]="demo.chip">Awaiting review</span>
    <span [style]="demo.chip">Paid</span>
  </div>
</div>`,
  }),
};

export const Separation: Story = {
  parameters: scenario('separation'),
  render: () => ({
    props: { demo, steps: [1, 4, 8] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Steps on the space scale</span>
      <span class="slotted-demo-scene__note">
        The default sits below the line height of the default type step, so a run reads as one line
        rather than as a list laid sideways.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        @for (step of steps; track step) {
          <div [style]="demo.row">
            <span [style]="demo.caption">gap {{ step }}</span>
            <div slInline [gap]="step">
              <span [style]="demo.chip">Draft</span>
              <span [style]="demo.chip">Awaiting review</span>
              <span [style]="demo.chip">Paid</span>
            </div>
          </div>
        }
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => ({
    props: { demo, alignments: ['center', 'baseline', 'start', 'stretch'] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Across the flow, and along it</span>
      <span class="slotted-demo-scene__note">
        baseline puts the type of every item on one line; centre only puts the boxes there. justify
        distributes what is left along the inline axis.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        @for (alignment of alignments; track alignment) {
          <div [style]="demo.row">
            <span [style]="demo.caption">align {{ alignment }}</span>
            <div [style]="demo.frame">
              <div slInline [gap]="4" [align]="alignment">
                <span [style]="demo.chip">Short</span>
                <span [style]="demo.chip + '; padding-block: var(--slotted-space-6)'">Taller item</span>
                <span [style]="demo.chip + '; font-size: 20px'">Larger type</span>
              </div>
            </div>
          </div>
        }
        <div [style]="demo.row">
          <span [style]="demo.caption">justify between</span>
          <div [style]="demo.frame">
            <div slInline [gap]="4" justify="between">
              <span [style]="demo.chip">Cancel</span>
              <span [style]="demo.chip">Save changes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Wrapping: Story = {
  parameters: scenario('wrapping'),
  render: () => ({
    props: { demo, statuses: STATUSES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Wrapping, and refusing to</span>
      <span class="slotted-demo-scene__note">
        Narrow the window. The first run wraps, and its rows keep the separation the gap states. The
        second was told to keep one line and overflows its container instead, which is what asking
        for nowrap costs.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column + '; ' + demo.fill">
        <div [style]="demo.row">
          <span [style]="demo.caption">wrap · the default</span>
          <div [style]="demo.frame">
            <div slInline>
              @for (status of statuses; track status) {
                <span [style]="demo.chip">{{ status }}</span>
              }
            </div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">nowrap</span>
          <div [style]="demo.frame">
            <div slInline wrap="nowrap">
              @for (status of statuses; track status) {
                <span [style]="demo.chip">{{ status }}</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { demo, items: ['First, and read first', 'Second', 'Third'] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">The element is the consumer’s</span>
      <span class="slotted-demo-scene__note">
        The selector is an attribute, so a ul stays a ul and a screen reader still announces a list
        of three items. Inline adds no role of its own, and offers no input that would let the
        visual order disagree with the reading order.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <ul slInline [gap]="2" [style]="demo.fill + '; margin: 0; padding: 0'">
        @for (item of items; track item) {
          <li [style]="'list-style: none'">
            <span [style]="demo.chip">{{ item }}</span>
          </li>
        }
      </ul>
    </div>
  </section>
</div>`,
  }),
};
