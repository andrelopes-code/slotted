import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignLeft,
  lucideAlignRight,
  lucideChartColumn,
  lucideMap,
  lucideTable,
} from '@ng-icons/lucide';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlTextField } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlSegmentedControl } from './segmented-control';
import type {
  SegmentedControlCondense,
  SegmentedControlOrientation,
  SegmentedControlSize,
} from './segmented-control-defaults';
import { SlSegment, SlSegmentIcon } from './segmented-control-parts';
import {
  ANGULAR_SEGMENTED_CONTROL_DOCS,
  ANGULAR_SEGMENTED_CONTROL_TOKENS,
} from './segmented-control.docs';

interface SegmentedControlStoryArgs {
  condense: SegmentedControlCondense;
  disabled: boolean;
  fullWidth: boolean;
  invalid: boolean;
  orientation: SegmentedControlOrientation;
  readOnly: boolean;
  required: boolean;
  size: SegmentedControlSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SEGMENTED_CONTROL_DOCS.segmentedControl.scenes, {
    playground: Playground,
    sizes: Sizes,
    orientation: Orientation,
    states: States,
    iconOnly: IconOnly,
    variants: Variants,
    condense: Condense,
    width: Width,
    field: InsideAField,
    form: InAForm,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  NgIcon,
  ReactiveFormsModule,
  SlButton,
  SlField,
  SlFieldDescription,
  SlFieldLabel,
  SlSegment,
  SlSegmentIcon,
  SlSegmentedControl,
  SlText,
  SlTextField,
];

const meta: Meta<SegmentedControlStoryArgs> = {
  title: 'Components/SegmentedControl',
  component: SlSegmentedControl,
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          lucideAlignCenter,
          lucideAlignLeft,
          lucideAlignRight,
          lucideChartColumn,
          lucideMap,
          lucideTable,
        }),
      ],
    }),
    moduleMetadata({ imports: DIRECTIVES }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Segmented Control',
        description:
          'One choice out of a few, applied at once, on a track. Every segment is a real radio sharing one name, so the platform supplies the whole keyboard, the submitted value and the position a screen reader announces — and the thumb’s place is arithmetic rather than measured.',
        framework: 'Angular',
        ...ANGULAR_SEGMENTED_CONTROL_DOCS.segmentedControl,
        tokens: ANGULAR_SEGMENTED_CONTROL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SegmentedControlStoryArgs>;

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

const RANGE = `<label slSegment value="day">Day</label>
  <label slSegment value="week">Week</label>
  <label slSegment value="month">Month</label>`;

const VIEW = `<label slSegment value="grid">Grid</label>
  <label slSegment value="list">Lista</label>`;

export const Playground: Story = {
  args: {
    condense: 'none',
    disabled: false,
    fullWidth: false,
    invalid: false,
    orientation: 'horizontal',
    readOnly: false,
    required: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slSegmentedControl
          aria-label="Chart period"
          defaultValue="week"
          [size]="size"
          [orientation]="orientation"
          [condense]="condense"
          [fullWidth]="fullWidth"
          [disabled]="disabled"
          [readOnly]="readOnly"
          [invalid]="invalid"
          [required]="required"
        >
          ${RANGE}
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The three steps',
        'Side by side rather than stacked: thirty, thirty-four and thirty-eight pixels is four pixels between neighbours, and a control stretched across the page hides a difference that small.',
        `<div slSegmentedControl aria-label="Small view" size="sm" defaultValue="grid">${VIEW}</div>
         <div slSegmentedControl aria-label="Medium view" size="md" defaultValue="grid">${VIEW}</div>
         <div slSegmentedControl aria-label="Large view" size="lg" defaultValue="grid">${VIEW}</div>`,
        'row',
      ) +
        scene(
          'In the row it shares with a field and a button',
          'This is the reason the height is measured back rather than added to: a control two pixels prouder than the field beside it is the defect nobody can name and everybody sees.',
          `<div class="slotted-demo-measure">
             <div slTextField><input slTextFieldInput value="INV-2048" aria-label="Invoice number" /></div>
           </div>
           <div slSegmentedControl aria-label="Currency" defaultValue="brl">
             <label slSegment value="brl">BRL</label>
             <label slSegment value="usd">USD</label>
           </div>
           <button slButton tone="secondary" variant="outline">Save invoice</button>`,
          'row',
        ),
    ),
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Along the line',
        'aria-orientation is written here because radiogroup already implies vertical, so the attribute says something exactly when the set flows the other way.',
        `<div slSegmentedControl aria-label="Period, inline" defaultValue="week">${RANGE}</div>`,
      ) +
        scene(
          'Down the page',
          'The thumb travels in the block axis and the rules between the segments turn with it. The platform moves the choice with both pairs of arrows either way.',
          `<div slSegmentedControl aria-label="Payment" orientation="vertical" defaultValue="invoice">
             <label slSegment value="card">Card</label>
             <label slSegment value="transfer">Transfer</label>
             <label slSegment value="invoice">ACH transfer</label>
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
        'One segment out of action',
        'An unavailable segment loses its ink and keeps its place. Point at the two beside it: a live segment answers with a neutral ground, and the chosen one does not answer at all.',
        `<div slSegmentedControl aria-label="Plan with one unavailable" defaultValue="starter">
           <label slSegment value="starter">Starter</label>
           <label slSegment value="team">Team</label>
           <label slSegment value="enterprise" disabled>Corporativo</label>
         </div>`,
      ) +
        scene(
          'The whole control out of action',
          'The track keeps its ground so the thumb still reads against it: a reader learns which of the three was chosen even in a control they cannot change.',
          `<div slSegmentedControl aria-label="Plan unavailable" disabled defaultValue="team">
             <label slSegment value="starter">Starter</label>
             <label slSegment value="team">Team</label>
             <label slSegment value="enterprise">Corporativo</label>
           </div>`,
        ) +
        scene(
          'Read-only',
          'It keeps every color and every tab stop and refuses the change on the click a pointer and Space share, because a radio has no readonly and it must not look disabled.',
          `<div slSegmentedControl aria-label="Plano somente leitura" readOnly defaultValue="team">
             <label slSegment value="starter">Inicial</label>
             <label slSegment value="team">Equipe</label>
             <label slSegment value="enterprise">Corporativo</label>
           </div>`,
        ) +
        scene(
          'Invalid, with nothing chosen',
          'The track takes the danger edge and the focus ring is pointed at the same step, so the outline and its shadow move together instead of being repainted rule by rule.',
          `<div slSegmentedControl aria-label="Plan invalid" invalid required>
             <label slSegment value="starter">Starter</label>
             <label slSegment value="team">Team</label>
             <label slSegment value="enterprise">Corporativo</label>
           </div>`,
        ),
    ),
  }),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Marks without words',
        'A segment with only a mark draws square and takes its name from the aria-label, which the family reads from the host and writes onto the radio that holds the focus.',
        `<div slSegmentedControl aria-label="Alignment" defaultValue="center">
           <label slSegment value="start" aria-label="Start">
             <ng-icon slSegmentIcon name="lucideAlignLeft" />
           </label>
           <label slSegment value="center" aria-label="Centro">
             <ng-icon slSegmentIcon name="lucideAlignCenter" />
           </label>
           <label slSegment value="end" aria-label="Fim">
             <ng-icon slSegmentIcon name="lucideAlignRight" />
           </label>
         </div>`,
      ) +
        scene(
          'At the smallest step',
          'The thumb is shorter than the control, so the radio reaches the track&#39;s own edge: the target stays the control&#39;s full height even where the thumb is eighteen pixels.',
          `<div slSegmentedControl aria-label="Small alignment" size="sm" defaultValue="center">
             <label slSegment value="start" aria-label="Start">
               <ng-icon slSegmentIcon name="lucideAlignLeft" />
             </label>
             <label slSegment value="center" aria-label="Centro">
               <ng-icon slSegmentIcon name="lucideAlignCenter" />
             </label>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A track',
        'The box with a thumb behind the chosen segment, every segment as wide as the widest.',
        `<div slSegmentedControl aria-label="Period, track" defaultValue="month">
           <label slSegment value="day">Day</label>
           <label slSegment value="week">Week</label>
           <label slSegment value="month">Month</label>
         </div>`,
      ) +
        scene(
          'The words alone',
          'The same radio group with no track: the chosen word in the text color and underlined, the others muted.',
          `<div slSegmentedControl aria-label="Period, underline" defaultValue="month" variant="underline">
             <label slSegment value="day">Day</label>
             <label slSegment value="week">Week</label>
             <label slSegment value="month">Month</label>
           </div>`,
        ),
    ),
  }),
};

export const Condense: Story = {
  parameters: scenario('condense'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Room for its words',
        'Above the breakpoint the control shows the mark and the label together, which is what a page header has room for and what a reader reads fastest.',
        `<div slSegmentedControl aria-label="Wide report" condense="icons" defaultValue="table">
           <label slSegment value="table"><ng-icon slSegmentIcon name="lucideTable" />Table</label>
           <label slSegment value="chart"><ng-icon slSegmentIcon name="lucideChartColumn" />Chart</label>
           <label slSegment value="map"><ng-icon slSegmentIcon name="lucideMap" />Map</label>
         </div>`,
      ) +
        scene(
          'Narrower than its words',
          'The same control in a sidebar keeps its marks and hides its words. They are hidden and not removed, so each segment is announced exactly as it was at the wider size.',
          measure(
            `<div slSegmentedControl aria-label="Narrow report" condense="icons" defaultValue="table">
               <label slSegment value="table"><ng-icon slSegmentIcon name="lucideTable" />Table</label>
               <label slSegment value="chart"><ng-icon slSegmentIcon name="lucideChartColumn" />Chart</label>
               <label slSegment value="map"><ng-icon slSegmentIcon name="lucideMap" />Map</label>
             </div>`,
          ),
        ),
    ),
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Every column is the widest label’s',
        'Left alone the track shrinks to its content and the columns stay equal, which is the rule Carbon states — taken from the layout here rather than measured by script.',
        `<div slSegmentedControl aria-label="Status" defaultValue="all">
           <label slSegment value="all">All</label>
           <label slSegment value="draft">Draft</label>
           <label slSegment value="sent">Sent</label>
           <label slSegment value="overdue">Overdue</label>
           <label slSegment value="paid">Paid</label>
         </div>`,
      ) +
        scene(
          'Sharing the whole line',
          'fullWidth spreads the same equal columns across the line the control was given, so a filter above a table lines up with the table&#39;s own edges.',
          `<div slSegmentedControl aria-label="Delivery" fullWidth defaultValue="afternoon">
             <label slSegment value="morning">Morning</label>
             <label slSegment value="afternoon">Afternoon</label>
             <label slSegment value="evening">Evening</label>
           </div>`,
        ),
    ),
  }),
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Labelled and described by its field',
        'The control takes its step and its state from the field and gives it back something to name: the label points at the set, and the description reaches it through aria-describedby.',
        `<div slField>
           <label slFieldLabel>Invoice currency</label>
           <div slSegmentedControl name="currency" defaultValue="brl">
             <label slSegment value="brl">BRL</label>
             <label slSegment value="usd">USD</label>
             <label slSegment value="eur">EUR</label>
           </div>
           <p slFieldDescription>The conversion uses the exchange rate on the issue date.</p>
         </div>`,
      ) +
        scene(
          'A field at the large step',
          'size comes from the field unless the control states its own, and invalid arrives the same way — one decision taken once, on the row that owns the label.',
          `<div slField size="lg">
             <label slFieldLabel>Deadline</label>
             <div slSegmentedControl name="speed" defaultValue="standard">
               <label slSegment value="standard">Standard</label>
               <label slSegment value="express">Express</label>
             </div>
           </div>`,
        ),
    ),
  }),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => ({
    props: { currency: new FormControl<string | null>(null) },
    template: grid(
      1,
      scene(
        'Owned by a reactive form, and validated',
        'The control writes the value, reports touched on blur and answers setDisabledState; required is validated over the set, which no single segment could see on its own.',
        `<div slSegmentedControl aria-label="Moeda" required [formControl]="currency">
           <label slSegment value="brl">BRL</label>
           <label slSegment value="usd">USD</label>
           <label slSegment value="eur">EUR</label>
         </div>
         <p slText size="sm" tone="muted">
           value: {{ currency.value ?? '—' }} · valid: {{ currency.valid }}
         </p>`,
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A label longer than its column',
        'Every column is equal, so the longer label clips at the ellipsis rather than making one segment wider than the rest — and its whole string stays in the DOM.',
        measure(
          `<div slSegmentedControl aria-label="Frequency" fullWidth defaultValue="now">
             <label slSegment value="now">Immediately</label>
             <label slSegment value="digest">Once a day, in the evening digest</label>
           </div>`,
        ),
      ) +
        scene(
          'A mirrored label inside a page that is not',
          'An Arabic segment reads right to left without the control mirroring around it, because the direction belongs to the text and the thumb follows the track.',
          `<div slSegmentedControl aria-label="Idioma" defaultValue="ar">
             <label slSegment value="ar"><span dir="rtl">العربية</span></label>
             <label slSegment value="en">English</label>
           </div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Every part is a directive on the consumer’s own element',
        'The label is the consumer&#39;s: its attributes and listeners stay as written, and the family adds the radio, the words and the wiring rather than the element itself.',
        `<div slSegmentedControl aria-label="Consumer view" defaultValue="grid">
           <label slSegment value="grid" data-testid="grid">Grid</label>
           <label slSegment value="list">List</label>
         </div>`,
      ) +
        scene(
          'A template reaches the instance',
          'exportAs hands the control over, so a template reads selection() and checkedIndex() from the family rather than holding a second copy of the same state.',
          `<div slSegmentedControl #view="slSegmentedControl" aria-label="Exported view" defaultValue="grid">
             <label slSegment value="grid">Grid</label>
             <label slSegment value="list">List</label>
           </div>
           <p slText size="sm" tone="muted">
             chosen: {{ view.selection() }} · index: {{ view.checkedIndex() }}
           </p>`,
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
        'Nothing chosen yet',
        'Tab lands on the first segment and there is no thumb to see; press an arrow or Space and it fades in where it belongs rather than sliding from an edge nobody saw.',
        `<div slSegmentedControl aria-label="Shipping with no choice">
           <label slSegment value="standard">Standard</label>
           <label slSegment value="express">Express</label>
           <label slSegment value="overnight">Overnight</label>
         </div>`,
      ) +
        scene(
          'With a choice already made',
          'Tab lands on the checked segment, and both pairs of arrows move focus and the choice together and wrap at the ends. Every row of that table is the platform&#39;s.',
          `<div slSegmentedControl aria-label="Shipping with a choice" defaultValue="express">
             <label slSegment value="standard">Standard</label>
             <label slSegment value="express">Express</label>
             <label slSegment value="overnight">Overnight</label>
           </div>`,
        ),
    ),
  }),
};
