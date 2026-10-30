import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlContainer } from './container';
import { SlContainerBreakout } from './container-breakout';
import { ANGULAR_CONTAINER_DOCS, ANGULAR_CONTAINER_TOKENS } from './container.docs';
import type { ContainerAlign, ContainerInset, ContainerSize } from './container';

interface ContainerStoryArgs {
  align: ContainerAlign;
  inset: ContainerInset;
  size: ContainerSize;
}

/**
 * Container paints nothing, so the reference page supplies the edges. `space`
 * is the box the container is given; `block` is anything inside the bounded
 * column, so the column's own edges are visible. Both are demonstration
 * devices and never part of the family.
 */
const demo = {
  space: [
    'background: var(--slotted-surface-sunken)',
    'border: 1px dashed var(--slotted-border-strong)',
    'border-radius: var(--slotted-radius-md)',
    'inline-size: 100%',
  ].join('; '),
  block: [
    'background: var(--slotted-surface-raised)',
    'border: 1px solid var(--slotted-border-subtle)',
    'border-radius: var(--slotted-radius-sm)',
    'box-sizing: border-box',
    'font-size: 12px',
    'padding-block: var(--slotted-space-3)',
    'padding-inline: var(--slotted-space-4)',
  ].join('; '),
  caption: [
    'color: var(--slotted-text-muted)',
    'display: block',
    'font-family: ui-monospace, monospace',
    'font-size: 11px',
    'padding-block-end: var(--slotted-space-3)',
  ].join('; '),
  prose: 'line-height: 1.5; margin: 0',
  strip: [
    'background: var(--slotted-surface-inverse)',
    'box-sizing: border-box',
    'color: var(--slotted-text-inverse)',
    'font-size: 12px',
    'margin-block: var(--slotted-space-5)',
    'padding: var(--slotted-space-4)',
  ].join('; '),
  rows: 'display: grid; gap: var(--slotted-space-8); inline-size: 100%',
  tight: 'display: grid; gap: var(--slotted-space-3); inline-size: 100%',
  fill: 'inline-size: 100%',
  /** The maxima retuned small, so four steps all wider than this stage still differ. */
  retuned: [
    'display: grid',
    'gap: var(--slotted-space-8)',
    'inline-size: 100%',
    '--slotted-container-measure: 16ch',
    '--slotted-container-content: 14rem',
    '--slotted-container-wide: 22rem',
  ].join('; '),
};

const paragraph =
  'Invoices are issued on the first working day of each month and settle against the payment ' +
  'method on file. A line this long is where a reader starts to lose the beginning of the next ' +
  'one, which is the whole reason the bound exists.';

const steps = [
  { size: 'measure', note: '16ch here · the comfortable reading line' },
  { size: 'content', note: '14rem here · the default' },
  { size: 'wide', note: '22rem here · a dense application page' },
  { size: 'full', note: '120rem elsewhere · the frame, up to the ceiling' },
  { size: 'bleed', note: 'no maximum, and the gutters remain' },
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Bounds as never,
});

const meta: Meta<ContainerStoryArgs> = {
  title: 'Components/Container',
  component: SlContainer,
  decorators: [moduleMetadata({ imports: [SlContainer, SlContainerBreakout] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Container',
        description:
          'A bounded, inset, placed column — and the owner of comfortable measure. A breakout child reaches both edges.',
        framework: 'Angular',
        ...ANGULAR_CONTAINER_DOCS.container,
        tokens: ANGULAR_CONTAINER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ContainerStoryArgs>;

export const Playground: Story = {
  args: { align: 'center', inset: 6, size: 'content' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, demo },
    template: `
<div class="slotted-demo-stage" data-align="start">
  <div [style]="demo.space">
    <div slContainer [size]="size" [inset]="inset" [align]="align">
      <div [style]="demo.block">Bounded, inset and placed</div>
    </div>
  </div>
</div>`,
  }),
};

export const Measure: Story = {
  parameters: scenario('measure'),
  render: () => ({
    props: { demo, paragraph },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">The line, counted in characters</span>
      <span class="slotted-demo-scene__note">
        measure states 65ch, so the bound follows the inherited type and the reader's zoom. A
        maximum stated in pixels gets longer in characters when the text is enlarged, which is the
        opposite of what the bound is for. WCAG SC 1.4.8 caps a line at eighty characters.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.rows">
        <div>
          <span [style]="demo.caption">size measure</span>
          <div [style]="demo.space">
            <div slContainer size="measure">
              <p [style]="demo.prose">{{ paragraph }}</p>
            </div>
          </div>
        </div>
        <div>
          <span [style]="demo.caption">size full · the same paragraph across the whole space</span>
          <div [style]="demo.space">
            <div slContainer size="full">
              <p [style]="demo.prose">{{ paragraph }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Bounds: Story = {
  parameters: scenario('bounds'),
  render: () => ({
    props: { demo, steps, alignments: ['start', 'center', 'end'], insets: [0, 6, 9] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Four steps, named for what they bound</span>
      <span class="slotted-demo-scene__note">
        The maxima are retuned small here so all four differ at this width. That is also the whole
        theming story: the bound is a token, and nothing else in the family changes. Nothing here
        answers density — how tightly controls are packed is not a page decision.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.retuned">
        @for (step of steps; track step.size) {
          <div>
            <span [style]="demo.caption">{{ step.size }} · {{ step.note }}</span>
            <div [style]="demo.space">
              <div slContainer [size]="step.size">
                <div [style]="demo.block">Bounded</div>
              </div>
            </div>
          </div>
        }
        <div>
          <span [style]="demo.caption">align start · center · end, and inset 0 · 6 · 9</span>
          <div [style]="demo.tight">
            @for (alignment of alignments; track alignment) {
              <div [style]="demo.space">
                <div slContainer size="content" [align]="alignment">
                  <div [style]="demo.block">align {{ alignment }}</div>
                </div>
              </div>
            }
            @for (step of insets; track step) {
              <div [style]="demo.space">
                <div slContainer size="full" [inset]="step">
                  <div [style]="demo.block">inset {{ step }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Breakout: Story = {
  parameters: scenario('breakout'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A child that reaches both edges</span>
      <span class="slotted-demo-scene__note">
        The breakout answers the container, not the viewport, so it is still correct nested, inside
        a scroll region, and in a container that does not fill the page. Bounded content returns
        inside it by nesting another container.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.space">
        <div slContainer size="measure">
          <p [style]="demo.prose">
            Usage this month. The summary below is billed per seat and settles with the invoice.
          </p>
          <div slContainerBreakout [style]="demo.strip">
            <div slContainer size="full" [inset]="9">
              <div style="font-size: 12px">
                A strip at the container's edge, with a container of its own inside it.
              </div>
            </div>
          </div>
          <p [style]="demo.prose">Bounded content resumes after it, at the same column.</p>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">One container inside another</span>
      <span class="slotted-demo-scene__note">
        The bound is the smaller of the maximum and what is left after both gutters, so an inner
        container never exceeds its outer one and the insets add rather than fight. Separation
        between children is Stack's; the container only bounds.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.space">
        <div slContainer size="full" [inset]="6">
          <div [style]="demo.space">
            <div slContainer size="content" [inset]="6">
              <div [style]="demo.tight">
                <div [style]="demo.block">Inner column, inset again</div>
                <div [style]="demo.block">Second row, same column</div>
              </div>
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
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">The element is the template's</span>
      <span class="slotted-demo-scene__note">
        The directive is written on a main, so the landmark a screen reader announces is the one the
        page chose. Container adds no role of its own. A long unbroken token overflows its own box
        rather than widening the page, which is the two-axis scroll SC 1.4.10 refuses.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.rows">
        <div [style]="demo.space">
          <main slContainer size="measure" aria-label="Billing">
            <p [style]="demo.prose">A main landmark that happens to be bounded.</p>
          </main>
        </div>
        <div [style]="demo.retuned">
          <div>
            <span [style]="demo.caption">
              a token longer than the column, given nothing to break it
            </span>
            <div [style]="demo.space">
              <div slContainer size="measure" align="start">
                <div [style]="demo.block">The column is this wide</div>
                <p [style]="demo.prose + '; overflow-wrap: normal'">
                  Kraftfahrzeughaftpflichtversicherungsbedingungen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};
