import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlStack } from './stack';
import { ANGULAR_STACK_DOCS, ANGULAR_STACK_TOKENS } from './stack.docs';
import type { StackAlign, StackGap, StackJustify } from './stack';

interface StackStoryArgs {
  align?: StackAlign;
  gap: StackGap;
  justify?: StackJustify;
}

/**
 * Stack paints nothing, so the reference page supplies the edges. The tile, the
 * caption and the frame are demonstration devices and never part of the family.
 */
const demo = {
  tile: [
    'background: var(--slotted-surface-sunken)',
    'border: 1px solid var(--slotted-border-subtle)',
    'border-radius: var(--slotted-radius-sm)',
    'font-size: 12px',
    'padding-block: var(--slotted-space-3)',
    'padding-inline: var(--slotted-space-4)',
  ].join('; '),
  caption: 'color: var(--slotted-text-muted); font-size: 11px',
  frame: [
    'border: 1px dashed var(--slotted-border-strong)',
    'border-radius: var(--slotted-radius-md)',
    'inline-size: 100%',
    'padding: var(--slotted-space-3)',
  ].join('; '),
  fill: 'inline-size: 100%',
};

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Separation as never,
});

const meta: Meta<StackStoryArgs> = {
  title: 'Components/Stack',
  component: SlStack,
  decorators: [moduleMetadata({ imports: [SlStack] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stack',
        description: 'Children along the block axis, separated by one step of the space scale.',
        framework: 'Angular',
        ...ANGULAR_STACK_DOCS.stack,
        tokens: ANGULAR_STACK_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StackStoryArgs>;

export const Playground: Story = {
  args: { gap: 6 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, demo },
    template: `
<div class="slotted-demo-stage" data-align="start">
  <div slStack [gap]="gap" [align]="align" [justify]="justify" [style]="demo.fill">
    <div [style]="demo.tile">Workspace</div>
    <div [style]="demo.tile">Members</div>
    <div [style]="demo.tile">Billing</div>
  </div>
</div>`,
  }),
};

export const Separation: Story = {
  parameters: scenario('separation'),
  render: () => ({
    props: { demo, steps: [0, 2, 6, 9] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Steps on the space scale</span>
      <span class="slotted-demo-scene__note">
        The separation is a step, never a length. Nothing here changes with density: how tightly
        controls are packed is not a composition decision.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slStack [gap]="9" [style]="demo.fill">
        @for (step of steps; track step) {
          <div slStack [gap]="3">
            <span [style]="demo.caption">gap {{ step }}</span>
            <div slStack [gap]="step">
              <div [style]="demo.tile">Workspace</div>
              <div [style]="demo.tile">Members</div>
              <div [style]="demo.tile">Billing</div>
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
    props: { demo, alignments: ['stretch', 'start', 'center', 'end'] },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Across the flow, and along it</span>
      <span class="slotted-demo-scene__note">
        align positions children across the flow, which for a stack is the inline axis. justify
        positions them along it, and moves nothing until the stack has a block size.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slStack [gap]="8" [style]="demo.fill">
        @for (alignment of alignments; track alignment) {
          <div slStack [gap]="3">
            <span [style]="demo.caption">align {{ alignment }}</span>
            <div [style]="demo.frame">
              <div slStack [gap]="3" [align]="alignment">
                <div [style]="demo.tile">Invoice</div>
                <div [style]="demo.tile">Receipt for March</div>
              </div>
            </div>
          </div>
        }
        <div slStack [gap]="3">
          <span [style]="demo.caption">justify between</span>
          <div [style]="demo.frame + '; block-size: 220px'">
            <div slStack [gap]="3" align="start" justify="between" [style]="'block-size: 100%'">
              <div [style]="demo.tile">Header</div>
              <div [style]="demo.tile">Body</div>
              <div [style]="demo.tile">Footer</div>
            </div>
          </div>
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
      <span class="slotted-demo-scene__label">A stack of stacks</span>
      <span class="slotted-demo-scene__note">
        The outer stack separates sections and the inner one separates the lines inside them.
        Nothing sets a margin, so the rhythm is stated in one place.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slStack [gap]="8" [style]="demo.fill">
        <div slStack [gap]="5">
          <h2 [style]="'font-size: 20px; font-weight: 600; margin: 0'">Billing and invoices</h2>
          <p [style]="'line-height: 1.5; margin: 0'">
            Invoices are issued on the first working day of each month and settle against the
            payment method on file.
          </p>
        </div>
        <div slStack [gap]="6">
          <div slStack [gap]="2">
            <span [style]="'font-weight: 600'">Payment method</span>
            <span [style]="demo.caption">Visa ending 4242</span>
          </div>
          <div slStack [gap]="2">
            <span [style]="'font-weight: 600'">Billing address</span>
            <span [style]="demo.caption">200 Maple Street, Boston</span>
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
        of three items. Stack adds no role of its own, and offers no input that would let the
        visual order disagree with the reading order.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <ul slStack [gap]="3" [style]="demo.fill + '; margin: 0; padding: 0'">
        @for (item of items; track item) {
          <li [style]="'list-style: none'">
            <div [style]="demo.tile">{{ item }}</div>
          </li>
        }
      </ul>
    </div>
  </section>
</div>`,
  }),
};
