import { addDays, dayOfWeek, plainDate, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDateTimeRangePicker, SlDateTimeRangePickerPreset } from './datetime-range-picker';
import { provideDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type {
  DateTimeRange,
  DateTimeRangePickerCloseOnSelect,
  DateTimeRangePickerHourCycle,
  DateTimeRangePickerPlacement,
  DateTimeRangePickerSize,
  DateTimeRangePickerUnavailableOptions,
  DateTimeRangePickerVariant,
} from './datetime-range-picker-defaults';
import {
  SlDateTimeRangePickerFooter,
  SlDateTimeRangePickerOption,
  SlDateTimeRangePickerPresets,
} from './datetime-range-picker-parts';
import {
  ANGULAR_DATETIME_RANGE_PICKER_DOCS,
  ANGULAR_DATETIME_RANGE_PICKER_TOKENS,
} from './datetime-range-picker.docs';

interface DateTimeRangePickerStoryArgs {
  clearable: boolean;
  closeOnSelect: DateTimeRangePickerCloseOnSelect;
  contiguous: boolean;
  hourCycle: DateTimeRangePickerHourCycle;
  locale: string;
  months: number;
  placement: DateTimeRangePickerPlacement;
  size: DateTimeRangePickerSize;
  step: number;
  unavailableOptions: DateTimeRangePickerUnavailableOptions;
  variant: DateTimeRangePickerVariant;
}

/* One rental agency, one September: every scene is a car picked up and returned. */
const at = (date: PlainDate, time: PlainTime): PlainDateTime => ({ date, time });
const PICKUP = at(plainDate(2026, 9, 12), plainTime(14));
const DROPOFF = at(plainDate(2026, 9, 16), plainTime(11));
const RENTAL: DateTimeRange = { start: PICKUP, end: DROPOFF };
const OPEN: DateTimeRange = { start: PICKUP, end: null };
const SAME_DAY: DateTimeRange = { start: PICKUP, end: at(PICKUP.date, plainTime(18)) };
const REVERSED: DateTimeRange = { start: DROPOFF, end: PICKUP };
const WEEKEND: DateTimeRange = {
  start: at(plainDate(2026, 9, 18), plainTime(17)),
  end: at(plainDate(2026, 9, 20), plainTime(19)),
};
const NOW = at(plainDate(2026, 9, 14), plainTime(10, 20));
const SEASON_START = at(plainDate(2026, 9, 10), plainTime(9));
const SEASON_END = at(plainDate(2026, 12, 20), plainTime(18));
const week = (from: PlainDateTime): DateTimeRange => ({
  start: from,
  end: at(addDays(from.date, 7), from.time),
});
const isSunday = (date: PlainDate) => dayOfWeek(date) === 0;
const closesAtNoonOnSaturday = (time: PlainTime, date: PlainDate) =>
  dayOfWeek(date) === 6 && time.hour >= 12;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    completeness: Completeness,
    length: Length,
    limits: Limits,
    'day-window': DayWindow,
    unavailable: Unavailable,
    months: Months,
    now: Now,
    presets: Presets,
    'open-end': OpenEnd,
    sizes: Sizes,
    variants: Variants,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlDateTimeRangePicker,
  SlDateTimeRangePickerFooter,
  SlDateTimeRangePickerOption,
  SlDateTimeRangePickerPreset,
  SlDateTimeRangePickerPresets,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

/** The inputs every scene repeats: the agency's locale and its clock. */
const AGENCY = 'locale="pt-BR" [hourCycle]="24" [referenceDateTime]="clock"';

/** The agency names the two ends after what happens to the car, over the Portuguese catalog. */
const RENTAL_WORDS = {
  ...PT_BR,
  datetimeRangePicker: {
    ...PT_BR.datetimeRangePicker,
    end: 'Return',
    start: 'Pickup',
  },
};

/** The agency's own trigger and done button, for the scene that sets everything once. */
const AGENCY_WORDS = {
  ...RENTAL_WORDS,
  datetimeRangePicker: {
    ...RENTAL_WORDS.datetimeRangePicker,
    change: 'Alterar aluguel, {start} – {end}, {length}',
    done: 'Concluir',
  },
};

const meta: Meta<DateTimeRangePickerStoryArgs> = {
  title: 'Components/DateTimeRangePicker',
  component: SlDateTimeRangePicker,
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      /* The agency's language and its names for the two ends, once for every scene. */
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': RENTAL_WORDS } })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Time Range Picker',
        description:
          'A one-line frame with the range in words, and behind it one end at a time: two tabs, the field of the current end, a hint, the calendar in range mode and the list of that end, running on its day. The band says how long the run would be while it is drawn.',
        framework: 'Angular',
        ...ANGULAR_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker,
        tokens: ANGULAR_DATETIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateTimeRangePickerStoryArgs>;

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
  /** How small this scene's subject may legitimately be, for `tools/harness/audit.mjs`. */
  collapseFloor?: number,
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div
      class="slotted-demo-stage"
      data-layout="${layout}"
      ${collapseFloor === undefined ? '' : `data-collapse-floor="${String(collapseFloor)}"`}
    >${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** An open surface needs room under it, and the stage is what gives it. */
const screen = (body: string) =>
  `<div class="slotted-demo-viewport" data-size="screen">${body}</div>`;

/** A narrow column, for showing what the control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    contiguous: true,
    hourCycle: 24,
    locale: 'pt-BR',
    months: 1,
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    unavailableOptions: 'disable',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, rental: RENTAL, clock: NOW },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Pickup and return</label>
          <div
            slDateTimeRangePicker
            startName="retirada"
            endName="devolucao"
            [locale]="locale"
            [hourCycle]="hourCycle"
            [months]="months"
            [step]="step"
            [unavailableOptions]="unavailableOptions"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [closeOnSelect]="closeOnSelect"
            [contiguous]="contiguous"
            [clearable]="clearable"
            [referenceDateTime]="clock"
            [defaultValue]="rental"
          ></div>
          <span slFieldDescription>Abra e escolha os dias na grelha e as horas nas listas.</span>
        </div>
      </div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'The pickup tab, already open',
        'Two tabs say the two ends; the panel shows the one being chosen. The grid draws the 12th to the 16th, and the list runs on the 12th, the pickup’s day. Press the return tab: the same grid, and the list of the 16th. Press a day: the run restarts on it, and the end’s time is kept.',
        screen(`<div slDateTimeRangePicker defaultOpen ${AGENCY} [defaultValue]="rental"></div>`),
      ),
    ),
  }),
};

export const Completeness: Story = {
  parameters: scenario('completeness'),
  render: () => ({
    props: { clock: NOW },
    template: grid(
      1,
      scene(
        'Four presses',
        'Nothing chosen; the hint says what to choose. Press a day: focus moves to the list, for the pickup time. Press a time: the tab moves to the return and focus goes to the grid. Press a day, then a time: the work is whole and the surface closes. A rental never reaches the form half-drawn.',
        screen(`<div slDateTimeRangePicker defaultOpen ${AGENCY}></div>`),
      ),
    ),
  }),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => ({
    props: { open: OPEN, sameDay: SAME_DAY, clock: NOW },
    template: grid(
      2,
      scene(
        'Said as it is drawn',
        'A pickup on the 12th at 14:00 and no return. Move along the grid: the band says the days and hours for the day under you, at 14:00 on that day until a time is chosen.',
        `<div slDateTimeRangePicker ${AGENCY} [defaultValue]="open"></div>`,
      ) +
        scene(
          'On the same day, row by row',
          'A rental returned the day it started: the end list writes the duration beside each row. Across days the rows stay quiet and the band alone says it — a column of “3 days 21 hr 15 min” says nothing the band does not.',
          `<div slDateTimeRangePicker ${AGENCY} [defaultValue]="sameDay"></div>`,
        ),
    ),
  }),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => ({
    props: { open: OPEN, clock: NOW },
    template: grid(
      1,
      scene(
        'An hour to thirty days',
        'With the 12th at 14:00 chosen, the grid refuses the days past the 12th of October and the end list refuses the first hour; the band says why. Type a return an hour on instead: the frame is valid at exactly the limit.',
        `<div slField>
           <label slFieldLabel>Pickup and return</label>
           <div slDateTimeRangePicker ${AGENCY} [minLength]="3600" [maxLength]="30 * 86400" [defaultValue]="open"></div>
           <span slFieldError>A rental lasts from 1 hour to 30 days.</span>
         </div>`,
      ),
    ),
  }),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => ({
    props: {
      clock: NOW,
      fromSeasonStart: { start: SEASON_START, end: null } as DateTimeRange,
      seasonStart: SEASON_START,
      seasonEnd: SEASON_END,
      opening: plainTime(8),
      closing: plainTime(18),
    },
    template: grid(
      1,
      scene(
        'Opening hours inside a season',
        'The agency opens from 08:00 to 18:00; the fleet is booked from the 10th at 09:00 to the 20th of December at 18:00. Press the 10th: the list starts at 09:00. Press the 11th: it starts at 08:00. Both pairs of bounds apply, the platform’s own rule.',
        `<div slDateTimeRangePicker ${AGENCY} [min]="seasonStart" [max]="seasonEnd" [minTime]="opening" [maxTime]="closing" [defaultValue]="fromSeasonStart"></div>`,
      ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: { open: OPEN, clock: NOW, isSunday, closesAtNoonOnSaturday },
    template: grid(
      2,
      scene(
        'Closed on Sunday, half a day on Saturday',
        'The Sundays are greyed, and the end list on a Saturday stops at noon. With the 12th chosen, the grid refuses the 14th and everything past it: a rental cannot cross a closed day while it is contiguous.',
        `<div slDateTimeRangePicker ${AGENCY} [isDateUnavailable]="isSunday" [isTimeUnavailable]="closesAtNoonOnSaturday" [defaultValue]="open"></div>`,
      ) +
        scene(
          'A rule about the ends only',
          '[contiguous]="false": the Sundays are refused as ends and the run may jump over them — a rental returned on Monday is fine even though the agency was closed on Sunday.',
          `<div slDateTimeRangePicker ${AGENCY} [contiguous]="false" [isDateUnavailable]="isSunday" [isTimeUnavailable]="closesAtNoonOnSaturday" [defaultValue]="open"></div>`,
        ),
    ),
  }),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => ({
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'Two months',
        'Two months beside the list need about forty rems. Where the surface has them the three stand in a row; where it does not, the list drops under the grid and the second month wraps under the first.',
        `<div slDateTimeRangePicker ${AGENCY} [months]="2" [defaultValue]="rental"></div>`,
      ),
    ),
  }),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => ({
    props: { clock: NOW },
    template: grid(
      1,
      scene(
        'One now per end',
        'It is the 14th at 10:20. Press “Agora”: the pickup is written whole, both halves, the tab moves to the return and focus carries to the grid for its day. referenceDateTime fixes the clock for this page.',
        `<div slDateTimeRangePicker ${AGENCY}></div>`,
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: {
      clock: NOW,
      value: WEEKEND as DateTimeRange | null,
      weekend: WEEKEND,
      week: () => week(PICKUP),
      holiday: () => week(at(plainDate(2026, 10, 3), plainTime(9))),
    },
    template: grid(
      1,
      scene(
        'The rentals the agency offers by name',
        'The weekend is marked because it is the value. Press “One week”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions.',
        `<div slDateTimeRangePicker ${AGENCY} [value]="value" (valueChange)="value = $event.value">
           <div slDateTimeRangePickerPresets>
             <button [slDateTimeRangePickerPreset]="weekend">Weekend</button>
             <button [slDateTimeRangePickerPreset]="week">One week</button>
             <button [slDateTimeRangePickerPreset]="holiday">October holiday</button>
           </div>
           <div slDateTimeRangePickerFooter>
             <button type="button" (click)="value = null">Limpar</button>
           </div>
         </div>`,
      ),
    ),
  }),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => ({
    props: { open: OPEN, clock: NOW },
    template: grid(
      2,
      scene(
        'A pickup and no return',
        'A value with one end, written where the reader sees it: “12 de set., 14:00 –”. Open the surface: it opens on the return tab, the grid holds an open run, and the list runs on whichever day the grid has focused. The clear empties both ends at once.',
        `<div slDateTimeRangePicker clearable ${AGENCY} [defaultValue]="open"></div>`,
      ) +
        scene(
          'Both ends required',
          'required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a pickup alone.',
          `<div slField required>
             <label slFieldLabel>Pickup and return</label>
             <div slDateTimeRangePicker ${AGENCY}></div>
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'The three steps',
        'Type, height, gutter and the clear’s box follow the control scales, so a rental in a dense fleet table shrinks whole rather than in parts.',
        `<div slDateTimeRangePicker size="sm" clearable ${AGENCY} [defaultValue]="rental"></div>
         <div slDateTimeRangePicker size="md" clearable ${AGENCY} [defaultValue]="rental"></div>
         <div slDateTimeRangePicker size="lg" clearable ${AGENCY} [defaultValue]="rental"></div>`,
      ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'The three frames',
        'Hover each: the frame answers as one control. Tab to one: the ring is the frame’s, and in plain it is drawn inward, because a plain control’s box belongs to the cell around it.',
        `<div slDateTimeRangePicker variant="outline" ${AGENCY} [defaultValue]="rental"></div>
         <div slDateTimeRangePicker variant="subtle" ${AGENCY} [defaultValue]="rental"></div>
         <div slDateTimeRangePicker variant="plain" ${AGENCY} [defaultValue]="rental"></div>`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { rental: RENTAL, reversed: REVERSED, clock: NOW },
    template: grid(
      2,
      scene(
        'Read-only',
        'The rental is legible and copyable, and the trigger is out of the tab sequence: a surface onto a grid nothing answers is worse than no surface.',
        `<div slDateTimeRangePicker readOnly ${AGENCY} [defaultValue]="rental"></div>`,
      ) +
        scene(
          'Disabled',
          'Nothing answers and the value stays readable — a disabled rental still has to say when it is.',
          `<div slDateTimeRangePicker disabled clearable ${AGENCY} [defaultValue]="rental"></div>`,
        ) +
        scene(
          'A return before its pickup',
          'Invalid on the end field and on the frame, and nothing is swapped: a value the reader typed is not the family’s to rewrite. Tab in: the ring is retargeted to the danger colour.',
          `<div slField>
             <label slFieldLabel>Pickup and return</label>
             <div slDateTimeRangePicker ${AGENCY} [defaultValue]="reversed"></div>
             <span slFieldError>The return must come after the pickup.</span>
           </div>`,
        ) +
        scene(
          'The consumer’s own word',
          'invalid from the field around it, with a value the family finds nothing wrong with: the server said the car is gone.',
          `<div slField invalid>
             <label slFieldLabel>Pickup and return</label>
             <div slDateTimeRangePicker ${AGENCY} [defaultValue]="rental"></div>
             <span slFieldError>This car is already rented for that period.</span>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => {
    const control = new FormControl<DateTimeRange | null>(RENTAL);
    return {
      props: { control, clock: NOW },
      template: grid(
        1,
        scene(
          'A form control',
          'The whole { start, end } is the control’s value, and the family is its validator: a return before the pickup, a run over a closed day or a rental outside the limits reaches the control’s errors. Choose a rental and read the status.',
          `<div slField>
             <label slFieldLabel>Pickup and return</label>
             <div slDateTimeRangePicker ${AGENCY} [maxLength]="30 * 86400" [formControl]="control" startName="retirada" endName="devolucao"></div>
             <span slFieldDescription>
               {{ control.value?.start ? 'Pickup on day ' + control.value?.start?.date?.day : 'No pickup' }}
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
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'In a narrow column',
        'The frame stays one line at the control height; the value is cut with an ellipsis and the trigger’s name carries it whole. Open it: the list drops under the grid.',
        measure(`<div slDateTimeRangePicker clearable ${AGENCY} [defaultValue]="rental"></div>`),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { rental: RENTAL, sameDay: SAME_DAY, clock: NOW, position: 'start' },
    template: grid(
      1,
      scene(
        'Set once for the application',
        'provideSlotted decides that every rental is in Portuguese, with the agency’s own words laid over the catalog, and one defaults provider that it runs two months at a time in half-hour slots — so a product does not repeat eight inputs on each form.',
        `<div slDateTimeRangePicker [referenceDateTime]="clock" [defaultValue]="rental"></div>`,
      ) +
        scene(
          'What a row draws',
          'The slDateTimeRangePickerOption template replaces the row’s content and keeps the row: here each time is followed by the duration the family computed, on the day the list serves.',
          `<div slDateTimeRangePicker [referenceDateTime]="clock" [defaultValue]="sameDay">
             <ng-template slDateTimeRangePickerOption let-label="label" let-duration="duration">
               {{ label }}
               @if (duration) {
                 <span data-part="option-duration" data-part-option-duration="">{{ duration }}</span>
               }
             </ng-template>
           </div>`,
        ) +
        scene(
          'A template reaches the instance, and owns the end being edited',
          'exportAs hands the directive back: focus, openSurface and closeSurface are reachable from a button beside it. The consumer owns position — which tab — here: press “Edit return” and the surface opens onto the return tab, so the next press in the grid writes the return day instead of restarting the run.',
          `<div slDateTimeRangePicker #picker="slDateTimeRangePicker" [referenceDateTime]="clock" [defaultValue]="rental" [position]="position" (positionChange)="position = $event.value"></div>
           <button type="button" (click)="position = 'end'; picker.openSurface()">Edit return</button>
           <button type="button" (click)="picker.openSurface()">openSurface()</button>
           <button type="button" (click)="picker.closeSurface()">closeSurface()</button>
           <button type="button" (click)="picker.focus()">focus()</button>`,
          'stack',
          40,
        ),
    ),
  }),
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      providers: [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': AGENCY_WORDS } }),
        provideDateTimeRangePickerDefaults({ hourCycle: 24, months: 2, step: 1800 }),
      ],
    }),
  ],
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { rental: RENTAL, clock: NOW },
    template: grid(
      1,
      scene(
        'The grid, the list, and the band between them',
        'Tab to the trigger and press ArrowDown: focus lands on the 12th. Arrow right twice and press Enter: the run restarts on the 14th and focus is in the list. Press Enter on a time: the tab moves to the return. Enter on a return day, then Enter on a return time. Escape at any point abandons the work.',
        `<div slDateTimeRangePicker ${AGENCY} [defaultValue]="rental"></div>`,
      ),
    ),
  }),
};
