import { addDays, plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDateRangePicker, SlDateRangePickerPreset } from './date-range-picker';
import { provideDateRangePickerDefaults } from './date-range-picker-defaults';
import type {
  DateRange,
  DateRangePickerCloseOnSelect,
  DateRangePickerCount,
  DateRangePickerPlacement,
  DateRangePickerSize,
  DateRangePickerVariant,
} from './date-range-picker-defaults';
import { SlDateRangePickerFooter, SlDateRangePickerPresets } from './date-range-picker-parts';
import {
  ANGULAR_DATE_RANGE_PICKER_DOCS,
  ANGULAR_DATE_RANGE_PICKER_TOKENS,
} from './date-range-picker.docs';

interface DateRangePickerStoryArgs {
  clearable: boolean;
  closeOnSelect: DateRangePickerCloseOnSelect;
  contiguous: boolean;
  count: DateRangePickerCount;
  locale: string;
  months: number;
  placement: DateRangePickerPlacement;
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
}

/* One hotel, one September: every scene is a stay in it. */
const CHECKIN: PlainDate = plainDate(2026, 9, 12);
const CHECKOUT: PlainDate = plainDate(2026, 9, 16);
const STAY: DateRange = { start: CHECKIN, end: CHECKOUT };
const OPEN: DateRange = { start: CHECKIN, end: null };
const REVERSED: DateRange = { start: CHECKOUT, end: CHECKIN };
const WEEKEND: DateRange = { start: plainDate(2026, 9, 18), end: plainDate(2026, 9, 20) };
const week = (from: PlainDate): DateRange => ({ start: from, end: addDays(from, 7) });
const isTaken = (date: PlainDate) => date.month === 9 && date.day >= 15 && date.day <= 18;

/** The Portuguese catalog with a hotel's own words laid over the range picker's. */
const HOTEL = {
  ...PT_BR,
  dateRangePicker: {
    ...PT_BR.dateRangePicker,
    change: 'Alterar estadia, {start} – {end}, {length}',
    choose: 'Escolher estadia',
    end: 'Check-out',
    start: 'Check-in',
  },
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_RANGE_PICKER_DOCS.dateRangePicker.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    length: Length,
    limits: Limits,
    unavailable: Unavailable,
    presets: Presets,
    'open-end': OpenEnd,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlDateRangePicker,
  SlDateRangePickerFooter,
  SlDateRangePickerPreset,
  SlDateRangePickerPresets,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<DateRangePickerStoryArgs> = {
  title: 'Components/DateRangePicker',
  component: SlDateRangePicker,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Range Picker',
        description:
          'Two date fields in one frame, a trigger, and the calendar in range mode behind them. The band over the grid says how long the run is while it is still being drawn, which is the question the reader is actually asking.',
        framework: 'Angular',
        ...ANGULAR_DATE_RANGE_PICKER_DOCS.dateRangePicker,
        tokens: ANGULAR_DATE_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateRangePickerStoryArgs>;

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
    closeOnSelect: 'auto',
    contiguous: true,
    count: 'nights',
    locale: 'pt-BR',
    months: 2,
    placement: 'bottom-start',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, stay: STAY },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Estadia</label>
          <div
            slDateRangePicker
            [messages]="{ start: 'Check-in', end: 'Check-out' }"
            startName="checkin"
            endName="checkout"
            [locale]="locale"
            [count]="count"
            [months]="months"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [closeOnSelect]="closeOnSelect"
            [contiguous]="contiguous"
            [clearable]="clearable"
            [defaultValue]="stay"
          ></div>
          <span slFieldDescription>Type the dates or choose both in the calendar.</span>
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { stay: STAY },
    template: grid(
      1,
      scene(
        'The three steps',
        'Type, height, gutter and the two buttons’ boxes all follow the control scales, so a stay in a dense reservations table shrinks whole rather than in parts.',
        `<div slDateRangePicker size="sm" count="nights" locale="pt-BR" [defaultValue]="stay"></div>
         <div slDateRangePicker size="md" count="nights" locale="pt-BR" [defaultValue]="stay"></div>
         <div slDateRangePicker size="lg" count="nights" locale="pt-BR" [defaultValue]="stay"></div>`,
      ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { stay: STAY },
    template: grid(
      1,
      scene(
        'The three frames',
        'Hover each: the frame answers as one control, not as two fields side by side. Tab into one: the ring is the frame’s, and the band on a segment says which of the six fields a key will move.',
        `<div slDateRangePicker variant="outline" count="nights" locale="pt-BR" [defaultValue]="stay"></div>
         <div slDateRangePicker variant="subtle" count="nights" locale="pt-BR" [defaultValue]="stay"></div>
         <div slDateRangePicker variant="plain" count="nights" locale="pt-BR" [defaultValue]="stay"></div>`,
      ),
    ),
  }),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => ({
    props: { stay: STAY },
    template: grid(
      2,
      scene(
        'Nights',
        'Open it and press the 12th: the band says the nights the stay would cost for whichever day the pointer or the arrows are on, before the second press. 12 to 16 is 4 nights.',
        `<div slDateRangePicker count="nights" locale="pt-BR" [months]="1" [defaultValue]="stay"></div>`,
      ) +
        scene(
          'Days',
          'The same two dates, counted the way a leave request counts them: both ends, so 12 to 16 is 5 days, and the same day at both ends is 1 day rather than 0 nights.',
          `<div slDateRangePicker count="days" locale="pt-BR" [months]="1" [defaultValue]="stay"></div>`,
        ),
    ),
  }),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => ({
    props: { open: OPEN },
    template: grid(
      1,
      scene(
        'Two to seven nights',
        'Choose a check-in in the grid: the next night and every night past the seventh are struck through, and the band under the dates says why. Type a check-out ten nights on and the frame goes invalid instead.',
        `<div slField>
           <label slFieldLabel>Estadia</label>
           <div slDateRangePicker count="nights" locale="pt-BR" [months]="1" [minLength]="2" [maxLength]="7" [defaultValue]="open"></div>
           <span slFieldError>Uma estadia tem de 2 a 7 noites.</span>
         </div>`,
      ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: { open: OPEN, isTaken },
    template: grid(
      2,
      scene(
        'A stay cannot cross a taken night',
        'The room is taken from the 15th to the 18th. Press the 12th: the 15th and everything past it is refused, because a stay is contiguous; press the 19th instead and the run may only go forward.',
        `<div slDateRangePicker count="nights" locale="pt-BR" [months]="1" [isDateUnavailable]="isTaken" [defaultValue]="open"></div>`,
      ) +
        scene(
          'A rule about the ends only',
          '[contiguous]="false": the same four days are refused as ends and the run may jump over them — the shape a report period has when the blocked days are holidays rather than bookings.',
          `<div slDateRangePicker count="days" locale="pt-BR" [months]="1" [contiguous]="false" [isDateUnavailable]="isTaken" [defaultValue]="open"></div>`,
        ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: {
      weekend: WEEKEND,
      week: () => week(CHECKIN),
      holiday: () => week(plainDate(2026, 10, 3)),
    },
    template: grid(
      1,
      scene(
        'The stays the hotel offers by name',
        'The weekend is marked because it is the value. Press “One week”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions.',
        `<div slDateRangePicker #picker="slDateRangePicker" count="nights" locale="pt-BR" [months]="1" [defaultValue]="weekend">
           <div slDateRangePickerPresets>
             <button [slDateRangePickerPreset]="weekend">Weekend</button>
             <button [slDateRangePickerPreset]="week">One week</button>
             <button [slDateRangePickerPreset]="holiday">October holiday</button>
           </div>
           <div slDateRangePickerFooter>
             <button type="button" (click)="picker.closeSurface()">Close</button>
           </div>
         </div>`,
      ),
    ),
  }),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => ({
    props: { open: OPEN },
    template: grid(
      2,
      scene(
        'A check-in and no check-out',
        'A value with one end, written where the reader sees it. Open the surface: the 12th is the start of an open run, and the first press closes it. The clear empties both ends at once.',
        `<div slDateRangePicker clearable count="nights" locale="pt-BR" [months]="1" [defaultValue]="open"></div>`,
      ) +
        scene(
          'Both ends required',
          'required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a date on.',
          `<div slField required>
             <label slFieldLabel>Estadia</label>
             <div slDateRangePicker count="nights" locale="pt-BR" [months]="1"></div>
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { stay: STAY, reversed: REVERSED },
    template: grid(
      2,
      scene(
        'Read-only',
        'The stay is legible and copyable, and both buttons are out of the tab sequence: a surface onto a grid nothing answers is worse than no surface.',
        `<div slDateRangePicker readOnly count="nights" locale="pt-BR" [defaultValue]="stay"></div>`,
      ) +
        scene(
          'Disabled',
          'Nothing answers and the dates stay readable — a disabled reservation still has to say when it is.',
          `<div slDateRangePicker disabled clearable count="nights" locale="pt-BR" [defaultValue]="stay"></div>`,
        ) +
        scene(
          'A check-out before its check-in',
          'Invalid on the end field and on the frame, and nothing is swapped: a value the reader typed is not the family’s to rewrite. Tab in: the ring is retargeted to the danger colour.',
          `<div slField>
             <label slFieldLabel>Estadia</label>
             <div slDateRangePicker count="nights" locale="pt-BR" [defaultValue]="reversed"></div>
             <span slFieldError>O check-out tem de vir depois do check-in.</span>
           </div>`,
        ) +
        scene(
          'The consumer’s own word',
          'invalid from the field around it, with a value the family finds nothing wrong with: the server said the room is gone.',
          `<div slField invalid>
             <label slFieldLabel>Stay</label>
             <div slDateRangePicker count="nights" locale="pt-BR" [defaultValue]="stay"></div>
             <span slFieldError>This room is already booked for those dates.</span>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => {
    const control = new FormControl<DateRange | null>(STAY);
    return {
      props: { control },
      template: grid(
        1,
        scene(
          'A form control',
          'The whole { start, end } is the control’s value, and the family is its validator: a check-out before the check-in, a run over a taken night or a stay outside the limits reaches the control’s errors. Choose a stay and read the status.',
          `<div slField>
             <label slFieldLabel>Estadia</label>
             <div slDateRangePicker count="nights" locale="pt-BR" [months]="1" [maxLength]="7" [formControl]="control" startName="checkin" endName="checkout"></div>
             <span slFieldDescription>
               {{ control.value?.start ? 'Check-in on day ' + control.value?.start?.day : 'No check-in' }}
               · {{ control.valid ? 'valid' : 'invalid' }}
             </span>
           </div>`,
        ),
      ),
    };
  },
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { stay: STAY },
    template: grid(
      1,
      scene(
        'In a narrow column',
        'Two dates do not fit a frame this narrow, so each date clips its own digits at its edge and the trigger stays where it is; step into the check-out and it scrolls into view. Open it: the second month wraps under the first, because the surface is capped by the room the positioner measured.',
        measure(
          `<div slDateRangePicker count="nights" locale="pt-BR" [defaultValue]="stay"></div>`,
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { stay: STAY, position: 'start' },
    template: grid(
      1,
      scene(
        'Set once for the application',
        'One provider decides that every stay counts nights, one month at a time; provideSlotted decides Portuguese, with the hotel’s own words laid over the catalog — so a product does not repeat them on each form.',
        `<div slDateRangePicker [defaultValue]="stay"></div>`,
      ) +
        scene(
          'A template reaches the instance, and owns the end being edited',
          'exportAs hands the directive back: focus, openSurface and closeSurface are reachable from a button beside it. Press “Edit check-out” and the next press in the grid writes the end instead of restarting the run.',
          `<div slDateRangePicker #picker="slDateRangePicker" [defaultValue]="stay" [position]="position" (positionChange)="position = $event.value"></div>
           <button type="button" (click)="position = 'end'">Edit check-out</button>
           <button type="button" (click)="picker.focus('end')">focus('end')</button>
           <button type="button" (click)="picker.openSurface()">Open</button>
           <button type="button" (click)="picker.closeSurface()">Close</button>`,
          'stack',
        ),
    ),
  }),
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      providers: [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': HOTEL } }),
        provideDateRangePickerDefaults({ count: 'nights', months: 1 }),
      ],
    }),
  ],
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { stay: STAY },
    template: grid(
      1,
      scene(
        'Two presses, and the band between them',
        'Tab to the trigger and press Enter: focus lands on the 12th. Press Enter, then arrow right four times — the band says 1, 2, 3, 4 nights as you go — and press Enter again. Then open it once more and press Escape with one end chosen: the draft is abandoned.',
        `<div slDateRangePicker count="nights" locale="pt-BR" [months]="1" [defaultValue]="stay"></div>`,
      ),
    ),
  }),
};
