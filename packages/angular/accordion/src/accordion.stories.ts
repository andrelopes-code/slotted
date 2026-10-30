import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlButton } from '@slotted/angular/button';
import {
  SlCollapsible,
  SlCollapsibleContent,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAccordion } from './accordion';
import type {
  AccordionHeadingLevel,
  AccordionIndicator,
  AccordionMount,
  AccordionSize,
  AccordionTogglePlacement,
  AccordionVariant,
} from './accordion-defaults';
import { ANGULAR_ACCORDION_DOCS, ANGULAR_ACCORDION_TOKENS } from './accordion.docs';

interface AccordionStoryArgs {
  disabled: boolean;
  headingLevel: AccordionHeadingLevel;
  indicator: AccordionIndicator;
  loop: boolean;
  mount: AccordionMount;
  multiple: boolean;
  requireOpen: boolean;
  size: AccordionSize;
  togglePlacement: AccordionTogglePlacement;
  truncate: boolean;
  variant: AccordionVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ACCORDION_DOCS.accordion.scenes, {
    playground: Playground,
    multiple: Multiple,
    requireOpen: RequireOpen,
    variant: Variant,
    sizes: Sizes,
    mount: Mount,
    states: States,
    imperative: Imperative,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<AccordionStoryArgs> = {
  title: 'Components/Accordion',
  decorators: [
    moduleMetadata({
      imports: [
        SlAccordion,
        SlCollapsible,
        SlCollapsibleHeader,
        SlCollapsibleTrigger,
        SlCollapsiblePanel,
        SlCollapsibleContent,
        SlText,
        SlButton,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Accordion',
        description:
          'A set of disclosures that share a value. The pattern’s own keyboard with the arrows added on top of it, a header the set will not let close marked the way the pattern asks, and items that are a family beside this one rather than a part of it.',
        framework: 'Angular',
        ...ANGULAR_ACCORDION_DOCS.accordion,
        tokens: ANGULAR_ACCORDION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AccordionStoryArgs>;

const SECTIONS = `<div slCollapsible value="delivery">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery</button></h3>
    <div slCollapsiblePanel>
      <p slText size="sm">Scheduled for September 12, by Anna Rivers.</p>
    </div>
  </div>
  <div slCollapsible value="payment">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Payment</button></h3>
    <div slCollapsiblePanel>
      <p slText size="sm">Credit card, approved on September 1.</p>
    </div>
  </div>
  <div slCollapsible value="nota">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Invoice</button></h3>
    <div slCollapsiblePanel><p slText size="sm">Issued on September 3, series 4.</p></div>
  </div>`;

const order = (attributes = '') => `<div slAccordion ${attributes}>${SECTIONS}</div>`;

const scene = (label: string, note: string, body: string, layout = 'block') =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${scenes}</div>`;

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    headingLevel: '3',
    indicator: 'chevron',
    loop: true,
    mount: 'eager',
    multiple: false,
    requireOpen: false,
    size: 'md',
    togglePlacement: 'end',
    truncate: false,
    variant: 'ruled',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, value: ['delivery'] },
    template: `<div class="slotted-demo-stage" data-layout="block">
      <div
        slAccordion
        [value]="value"
        [multiple]="multiple"
        [requireOpen]="requireOpen"
        [loop]="loop"
        [size]="size"
        [variant]="variant"
        [indicator]="indicator"
        [togglePlacement]="togglePlacement"
        [headingLevel]="headingLevel"
        [mount]="mount"
        [truncate]="truncate"
        [disabled]="disabled"
      >${SECTIONS}</div>
    </div>`,
  }),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One at a time, the default',
        'Opening a section closes the one that was open, and that section is told it closed with the reason select — not because the reader asked it to.',
        order(`[value]="['delivery']"`),
      ) +
        scene(
          'Several at once',
          'Every section keeps its own state, so a reader comparing two of them does not have to reopen the first after reading the second.',
          order(`[multiple]="true" [value]="['delivery', 'payment']"`),
        ),
    ),
  }),
};

export const RequireOpen: Story = {
  parameters: scenario('requireOpen'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A set that may empty',
        'Pressing the open header closes it and the set shows nothing. It is the right answer where the sections are optional detail rather than the page itself.',
        order(`[value]="['delivery']"`),
      ) +
        scene(
          'A set that may not',
          'The one open header carries aria-disabled="true" — the pattern’s own instruction — so it stays focusable and announced while the press does nothing.',
          order(`[requireOpen]="true" [value]="['delivery']"`),
        ),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: grid(
      2,
      scene(
        'ruled, the default',
        'One hairline per seam and one under the last item, which the set draws itself so no item has to know whether it is the last.',
        order(`[value]="['delivery']"`),
      ) +
        scene(
          'framed',
          'The same ruled set inside one frame. The first item’s own rule is dropped, because two hairlines a pixel apart read as one thick line.',
          order(`variant="framed" [value]="['delivery']"`),
        ) +
        scene(
          'separated',
          'A card each, with the set owning only the air between them. It is the arrangement for sections that are not parts of one whole.',
          order(`variant="separated" [value]="['delivery']"`),
        ) +
        scene(
          'plain',
          'No chrome at all, for a set inside something that already draws its own edges — a card body, a settings column with its own rules.',
          order(`variant="plain" togglePlacement="start" [value]="['delivery']"`),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      3,
      scene(
        'sm',
        'The compact step for a set inside a side panel. The gap between cards steps with the type, so the rhythm holds at every size.',
        order(`size="sm" variant="separated" [value]="['delivery']"`),
      ) +
        scene(
          'md',
          'The default, and the step a page of sections is usually set at. One word moves every title and every row in the set.',
          order(`size="md" variant="separated" [value]="['delivery']"`),
        ) +
        scene(
          'lg',
          'The step for a set that organises a whole page, where each header is a landmark a reader scans for rather than a row in a list.',
          order(`size="lg" variant="separated" [value]="['delivery']"`),
        ),
    ),
  }),
};

export const Mount: Story = {
  parameters: scenario('mount'),
  render: () => ({
    template: grid(
      2,
      scene(
        'eager, the default',
        'Every panel’s content is in the DOM, so each one transitions closed rather than disappearing. Closed panels are inert and out of the accessibility tree.',
        order(`[value]="['delivery']"`),
      ) +
        scene(
          'lazy, for panels that fetch',
          'A panel’s content is built the first time it opens and kept afterwards, so arrowing past four sections makes no four requests.',
          `<div slAccordion mount="lazy">
            <div slCollapsible value="delivery">
              <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery</button></h3>
              <div slCollapsiblePanel>
                <ng-template slCollapsibleContent>
                  <p slText size="sm">Prevista para 12 de setembro.</p>
                </ng-template>
              </div>
            </div>
            <div slCollapsible value="payment">
              <h3 slCollapsibleHeader><button slCollapsibleTrigger>Payment</button></h3>
              <div slCollapsiblePanel>
                <ng-template slCollapsibleContent>
                  <p slText size="sm">Credit card, approved.</p>
                </ng-template>
              </div>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The whole set out of action',
        'disabled reaches every trigger as the native attribute, so the browser refuses each press and no row answers hover — one word for a page under a running job.',
        order(`[disabled]="true" [value]="['delivery']"`),
      ) +
        scene(
          'One item out of action inside a live set',
          'The item states its own disabled and the rest of the set stays operable, which is the case a set-wide attribute cannot express.',
          `<div slAccordion [value]="['delivery']">
            <div slCollapsible value="delivery">
              <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery</button></h3>
              <div slCollapsiblePanel>
                <p slText size="sm">Scheduled for September 12.</p>
              </div>
            </div>
            <div slCollapsible value="nota" [disabled]="true">
              <h3 slCollapsibleHeader>
                <button slCollapsibleTrigger description="not issued yet">Invoice</button>
              </h3>
              <div slCollapsiblePanel><p slText size="sm">Issued on September 3.</p></div>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const Imperative: Story = {
  parameters: scenario('imperative'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Two moves an array cannot express',
        'exportAs reaches the set from the template, so the pair Angular Material ships needs no component class in between. Both carry the reason programmatic.',
        `<div slAccordion #set="slAccordion" [multiple]="true">${SECTIONS}</div>
        <button slButton size="sm" variant="outline" (click)="set.openAll()">Open all</button>
        <button slButton size="sm" variant="outline" (click)="set.closeAll()">Close all</button>`,
      ) +
        scene(
          'The same set, holding one open',
          'closeAll leaves the first open panel where requireOpen holds it, so the pair can never put the set into a state the axis forbids.',
          `<div slAccordion #held="slAccordion" [multiple]="true" [requireOpen]="true">${SECTIONS}</div>
          <button slButton size="sm" variant="outline" (click)="held.openAll()">Open all</button>
          <button slButton size="sm" variant="outline" (click)="held.closeAll()">Close all</button>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      3,
      scene(
        'A set inside a panel',
        'The inner set stays closed while the outer one is open, and its headers stay out of the outer arrow ring — a nested accordion is two accordions, not one.',
        `<div slAccordion variant="framed" [value]="['externo']">
          <div slCollapsible value="externo">
            <h3 slCollapsibleHeader><button slCollapsibleTrigger>Advanced settings</button></h3>
            <div slCollapsiblePanel>
              <div slAccordion variant="plain">
                <div slCollapsible value="http">
                  <h3 slCollapsibleHeader><button slCollapsibleTrigger>HTTP headers</button></h3>
                  <div slCollapsiblePanel>
                    <p slText size="sm">The inner panel stays closed.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`,
      ) +
        scene(
          'Titles longer than their rows',
          'Each row grows and the marks stay in their own column, so a set of long headings still reads as a column of rows rather than a column of paragraphs.',
          measure(`<div slAccordion>
            <div slCollapsible value="devolucao">
              <h3 slCollapsibleHeader>
                <button slCollapsibleTrigger>
                  Return conditions for international orders
                </button>
              </h3>
              <div slCollapsiblePanel><p slText size="sm">Trinta dias corridos.</p></div>
            </div>
            <div slCollapsible value="trocas">
              <h3 slCollapsibleHeader>
                <button slCollapsibleTrigger>Exchanges for manufacturing defects</button>
              </h3>
              <div slCollapsiblePanel><p slText size="sm">One per order.</p></div>
            </div>
          </div>`),
        ) +
        scene(
          'Nothing to show',
          'A set with no items renders the box and nothing else. The message a page shows in its place is result-state’s, composed here rather than invented twice.',
          `<div slAccordion variant="ruled">
            <p slText size="sm" tone="muted">No sections for this order.</p>
          </div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The set, from the template',
        'exportAs reaches holds(), isHeld() and every resolved axis, so a page can ask the set what it is showing without a component class in between.',
        `<div slAccordion #set="slAccordion" variant="separated" [value]="['delivery']">${SECTIONS}</div>
        <p slText size="sm" tone="muted">Delivery open: {{ set.holds('delivery') }}</p>`,
      ) +
        scene(
          'The set, and the item beside it',
          'Each item is an slCollapsible with its own inputs, so one section may carry a summary line or a different mark while the set keeps the rest of the decisions.',
          `<div slAccordion variant="separated" [value]="['delivery']">
            <div slCollapsible value="delivery">
              <h3 slCollapsibleHeader>
                <button slCollapsibleTrigger description="3 of 12 items">Delivery</button>
              </h3>
              <div slCollapsiblePanel><p slText size="sm">Scheduled for September 12.</p></div>
            </div>
            <div slCollapsible value="payment" indicator="plus-minus">
              <h3 slCollapsibleHeader><button slCollapsibleTrigger>Payment</button></h3>
              <div slCollapsiblePanel><p slText size="sm">Credit card, approved.</p></div>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Every header is a tab stop',
        'Tab walks the set one header at a time, which is what the pattern requires; the arrows, Home and End move focus on top of that and open nothing.',
        order(`[value]="['delivery']"`),
      ) +
        scene(
          'Which device asked',
          'A click synthesised by Enter or Space reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener.',
          `<div slAccordion [value]="['delivery']" (valueChangeRequest)="reason = $event.reason">${SECTIONS}</div>
          <p slText size="sm" tone="muted">reason: {{ reason ?? '—' }}</p>`,
        ),
    ),
  }),
};
