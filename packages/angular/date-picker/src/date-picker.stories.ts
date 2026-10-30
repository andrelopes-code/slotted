import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDatePicker } from './date-picker';
import { provideDatePickerDefaults } from './date-picker-defaults';
import type {
  DatePickerPlacement,
  DatePickerSize,
  DatePickerVariant,
} from './date-picker-defaults';
import { SlDatePickerFooter, SlDatePickerPresets } from './date-picker-parts';
import { ANGULAR_DATE_PICKER_DOCS, ANGULAR_DATE_PICKER_TOKENS } from './date-picker.docs';

interface DatePickerStoryArgs {
  clearable: boolean;
  locale: string;
  placement: DatePickerPlacement;
  size: DatePickerSize;
  variant: DatePickerVariant;
}

const NINTH: PlainDate = plainDate(2026, 9, 9);

const isWeekend = (date: PlainDate) => {
  const day = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return day === 0 || day === 6;
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_PICKER_DOCS.datePicker.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    presets: Presets,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  SlDatePicker,
  SlDatePickerFooter,
  SlDatePickerPresets,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<DatePickerStoryArgs> = {
  title: 'Components/DatePicker',
  component: SlDatePicker,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Picker',
        description:
          'A date field and a month grid behind one trigger, composed rather than redrawn: both halves keep their own identifier, their own keyboard and their own semantics, and this family owns the frame, the trigger and the layer between them.',
        framework: 'Angular',
        ...ANGULAR_DATE_PICKER_DOCS.datePicker,
        tokens: ANGULAR_DATE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DatePickerStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
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

/** A narrow column, for showing what the control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    clearable: true,
    locale: 'pt-BR',
    placement: 'bottom-start',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ninth: NINTH },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Vencimento</label>
          <div
            slDatePicker
            name="vencimento"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [clearable]="clearable"
            [defaultValue]="ninth"
          ></div>
          <span slFieldDescription>Type the date or choose from the calendar.</span>
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'The three steps',
        'Type, height, padding and the trigger’s own box all follow the control scales, so a picker in a dense table shrinks whole rather than in parts.',
        `<div slDatePicker size="sm" locale="pt-BR" aria-label="Small" [defaultValue]="ninth"></div>
         <div slDatePicker size="md" locale="pt-BR" aria-label="Default" [defaultValue]="ninth"></div>
         <div slDatePicker size="lg" locale="pt-BR" aria-label="Large" [defaultValue]="ninth"></div>`,
      ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'The three frames',
        'The trigger keeps its calendar mark in all three: what it says — this holds a date — does not change with how much border there is around it.',
        `<div slDatePicker variant="outline" locale="pt-BR" aria-label="Contorno" [defaultValue]="ninth"></div>
         <div slDatePicker variant="subtle" locale="pt-BR" aria-label="Discreto" [defaultValue]="ninth"></div>
         <div slDatePicker variant="plain" locale="pt-BR" aria-label="Simples" [defaultValue]="ninth"></div>`,
      ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'Below, aligned to the start',
        'The default. Open it and scroll the page: the positioner flips the surface when there is no longer room under the control.',
        `<div slDatePicker placement="bottom-start" locale="pt-BR" aria-label="Below" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'Above, aligned to the end',
          'A preference rather than a promise: what the positioner resolved is on the layer as data-placement, which is what a test reads.',
          `<div slDatePicker placement="top-end" locale="pt-BR" aria-label="Above" [defaultValue]="ninth"></div>`,
        ),
    ),
  }),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => ({
    props: { ninth: NINTH, first: plainDate(2026, 1, 1), last: plainDate(2026, 12, 31) },
    template: grid(
      1,
      scene(
        'One pair of inputs, both halves',
        'Type 31/12/2025 into the field and it goes invalid; open the surface and the grid stops the reader at the first of January. Neither half was told separately.',
        `<div slField>
           <label slFieldLabel>Vencimento em 2026</label>
           <div slDatePicker locale="pt-BR" [defaultValue]="ninth" [min]="first" [max]="last"></div>
           <span slFieldError>Escolha uma data de 2026.</span>
         </div>`,
      ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: { ninth: NINTH, isWeekend },
    template: grid(
      1,
      scene(
        'No weekends, in both halves',
        'The grid strikes a Saturday through and refuses the press; the field marks the same date invalid when it is typed. One predicate, two answers, no duplication.',
        `<div slField>
           <label slFieldLabel>Delivery</label>
           <div slDatePicker locale="pt-BR" [defaultValue]="ninth" [isDateUnavailable]="isWeekend"></div>
           <span slFieldError>We deliver on business days only.</span>
         </div>`,
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'The two slots the consumer fills',
        'The shortcuts stand in a column beside the grid and the actions under it. The labels and the dates are the product’s: a preset list in the contract would be this library guessing at a fiscal year.',
        `<div slDatePicker locale="pt-BR" aria-label="Com atalhos" [defaultValue]="ninth">
           <div slDatePickerPresets>
             <button type="button">Today</button>
             <button type="button">Tomorrow</button>
             <button type="button">In 30 days</button>
           </div>
           <div slDatePickerFooter>
             <button type="button">Limpar</button>
           </div>
         </div>`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'Read-only',
        'The value is legible and copyable and the trigger is out of the tab sequence: a surface that opened onto a grid nothing answers is worse than no surface at all.',
        `<div slDatePicker readOnly locale="pt-BR" aria-label="Somente leitura" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'Disabled',
          'Nothing answers, nothing is in the tab sequence, and the date is still readable — a disabled form still has to say what it holds.',
          `<div slDatePicker disabled locale="pt-BR" aria-label="Desativado" [defaultValue]="ninth"></div>`,
        ) +
        scene(
          'Invalid',
          'Tab into the field and then into the trigger: the ring is retargeted to the danger color on both, from one custom property the frame points at the error.',
          `<div slDatePicker invalid locale="pt-BR" aria-label="Invalid" [defaultValue]="ninth"></div>`,
        ) +
        scene(
          'Required',
          'The field draws the necessity mark and its group carries aria-required, so the fact is both seen and heard.',
          `<div slField required>
             <label slFieldLabel>Vencimento</label>
             <div slDatePicker locale="pt-BR"></div>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'A plain form post',
        'Choose a date in the grid and submit: the hidden input sends 2026-09-17 under the name, whether the reader typed it or pressed it.',
        `<form action="/reservas" method="post">
           <div slField>
             <label slFieldLabel>Entrada</label>
             <div slDatePicker name="entrada" required locale="pt-BR" [defaultValue]="ninth"></div>
           </div>
           <button type="submit">Reservar</button>
         </form>`,
      ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'In a narrow column',
        'The control holds and the surface is measured against the room there is. On a coarse pointer below 480 pixels it becomes a sheet on the bottom edge, and the DOM says which one it is.',
        measure(
          `<div slDatePicker locale="pt-BR" aria-label="Estreito" [defaultValue]="ninth"></div>`,
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'Set once for the application',
        'One provider decides the zone for every picker under it, and provideSlotted the language that writes the date and names the trigger, so a product does not repeat them on each form.',
        `<div slDatePicker aria-label="Herdado" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'A template reaches the instance',
          'exportAs hands the directive back, so openSurface(), closeSurface() and focus() are reachable from a button beside it.',
          `<div slDatePicker #picker="slDatePicker" locale="pt-BR" aria-label="Controlled" [defaultValue]="ninth"></div>
           <button type="button" (click)="picker.openSurface()">Open</button>
           <button type="button" (click)="picker.closeSurface()">Close</button>`,
        ),
    ),
  }),
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      providers: [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
        provideDatePickerDefaults({ timeZone: 'America/Sao_Paulo' }),
      ],
    }),
  ],
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'The chord, and the staged Escape',
        'Focus a segment and press Alt with ArrowDown. Then press the heading twice and press Escape three times: the first two walk the views down and only the third closes the surface.',
        `<div slDatePicker locale="pt-BR" aria-label="Teclado" [defaultValue]="ninth"></div>`,
      ),
    ),
  }),
};
