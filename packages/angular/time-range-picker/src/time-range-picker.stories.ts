import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTimeRangePicker, SlTimeRangePickerPreset } from './time-range-picker';
import { provideTimeRangePickerDefaults } from './time-range-picker-defaults';
import type {
  TimeRange,
  TimeRangePickerCloseOnSelect,
  TimeRangePickerHourCycle,
  TimeRangePickerPlacement,
  TimeRangePickerSize,
  TimeRangePickerUnavailableOptions,
  TimeRangePickerVariant,
} from './time-range-picker-defaults';
import {
  SlTimeRangePickerFooter,
  SlTimeRangePickerOption,
  SlTimeRangePickerPresets,
} from './time-range-picker-parts';
import {
  ANGULAR_TIME_RANGE_PICKER_DOCS,
  ANGULAR_TIME_RANGE_PICKER_TOKENS,
} from './time-range-picker.docs';

interface TimeRangePickerStoryArgs {
  clearable: boolean;
  closeOnSelect: TimeRangePickerCloseOnSelect;
  contiguous: boolean;
  hourCycle: TimeRangePickerHourCycle;
  locale: string;
  placement: TimeRangePickerPlacement;
  size: TimeRangePickerSize;
  step: number;
  unavailableOptions: TimeRangePickerUnavailableOptions;
  variant: TimeRangePickerVariant;
}

/* One meeting room, one working day: every scene is a booking of it. */
const START = plainTime(14);
const END = plainTime(16, 30);
const BOOKING: TimeRange = { start: START, end: END };
const OPEN: TimeRange = { start: START, end: null };
const FROM_TEN: TimeRange = { start: plainTime(10), end: null };
const FROM_NINE: TimeRange = { start: plainTime(9), end: null };
const REVERSED: TimeRange = { start: plainTime(22), end: plainTime(6) };
const MORNING: TimeRange = { start: plainTime(9), end: plainTime(12) };
const AFTERNOON: TimeRange = { start: plainTime(14), end: plainTime(18) };
const TEN_TWENTY = plainTime(10, 20);
const isCleaning = (time: PlainTime) => time.hour === 12;
const HOURS_BEFORE_NOON = [8, 9, 10, 11].map((hour) => plainTime(hour));
const AFTER_NOON = [13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5].map((hour) =>
  plainTime(Math.floor(hour), hour % 1 === 0 ? 0 : 30),
);
const minutes = (seconds: number) => `${String(Math.round(seconds / 60))} min`;
/** The office's own words for the trigger and the done button, laid over the Portuguese catalog. */
const OFFICE = {
  ...PT_BR,
  timeRangePicker: {
    ...PT_BR.timeRangePicker,
    change: 'Change booking, {start} – {end}, {length}',
    choose: 'Choose time',
    done: 'Done',
  },
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIME_RANGE_PICKER_DOCS.timeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    length: Length,
    limits: Limits,
    unavailable: Unavailable,
    step: Step,
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
  SlTimeRangePicker,
  SlTimeRangePickerFooter,
  SlTimeRangePickerOption,
  SlTimeRangePickerPreset,
  SlTimeRangePickerPresets,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

/** The inputs every scene repeats: the room's words, its clock and its hours. */
const ROOM = 'locale="pt-BR" [hourCycle]="24" [referenceTime]="clock"';

const meta: Meta<TimeRangePickerStoryArgs> = {
  title: 'Components/TimeRangePicker',
  component: SlTimeRangePicker,
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      /* The room's language, once for every scene. */
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Range Picker',
        description:
          'A one-line frame with the range in words, and behind it one end at a time: two tabs, the field of the current end, a hint, and its list. The end list strikes what the chosen start refuses the moment the tab moves to it, and every row says how long the run would be.',
        framework: 'Angular',
        ...ANGULAR_TIME_RANGE_PICKER_DOCS.timeRangePicker,
        tokens: ANGULAR_TIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimeRangePickerStoryArgs>;

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
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    unavailableOptions: 'disable',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, booking: BOOKING, clock: TEN_TWENTY },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Reserva da sala</label>
          <div
            slTimeRangePicker
            startName="start"
            endName="end"
            [locale]="locale"
            [hourCycle]="hourCycle"
            [step]="step"
            [unavailableOptions]="unavailableOptions"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [closeOnSelect]="closeOnSelect"
            [contiguous]="contiguous"
            [clearable]="clearable"
            [referenceTime]="clock"
            [defaultValue]="booking"
          ></div>
          <span slFieldDescription>Open and choose the start and end in the two lists.</span>
        </div>
      </div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { open: OPEN, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'The end tab, already open',
        'Two tabs say the two ends; the panel shows the one being chosen. The start is 14:00, so the end tab is current, the hint says what to choose, and the list strikes 13:00 to 13:45 and writes “15 min”, “30 min”, “1 hr” beside every time it does allow. Press one: the meeting is whole and the surface closes.',
        screen(`<div slTimeRangePicker defaultOpen ${ROOM} [defaultValue]="open"></div>`),
      ),
    ),
  }),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => ({
    props: { open: OPEN, booking: BOOKING, clock: TEN_TWENTY, minutes },
    template: grid(
      2,
      scene(
        'Said as it is drawn',
        'Open it and move along the end list with the pointer or the arrows: the band says the duration for the row under you, and every row says it beside its time.',
        `<div slTimeRangePicker ${ROOM} [defaultValue]="open"></div>`,
      ) +
        scene(
          'In the product’s own words',
          'lengthLabel replaces the default: here the booking is counted in minutes, the unit a meeting room is billed in.',
          `<div slTimeRangePicker ${ROOM} [lengthLabel]="minutes" [defaultValue]="booking"></div>`,
        ),
    ),
  }),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => ({
    props: { open: OPEN, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'Thirty minutes to four hours',
        'With 14:00 as the start, the end list strikes 14:15 and everything past 18:00, and the band says why. Type 19:00 into the end field instead: the frame goes invalid.',
        `<div slField>
           <label slFieldLabel>Reserva da sala</label>
           <div slTimeRangePicker ${ROOM} [minLength]="30 * 60" [maxLength]="4 * 3600" [defaultValue]="open"></div>
           <span slFieldError>Uma reserva tem de 30 minutos a 4 horas.</span>
         </div>`,
      ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: { fromTen: FROM_TEN, clock: TEN_TWENTY, isCleaning },
    template: grid(
      2,
      scene(
        'A booking cannot cross the cleaning hour',
        'The room is cleaned from 12:00 to 13:00. With 10:00 as the start, the end list strikes 12:00 and everything past it, because a booking is contiguous.',
        `<div slTimeRangePicker ${ROOM} [isTimeUnavailable]="isCleaning" [defaultValue]="fromTen"></div>`,
      ) +
        scene(
          'A rule about the ends only',
          '[contiguous]="false": the cleaning slots are refused as ends and the run may jump over them — the shape a shift has when the blocked hour is a break rather than a booking.',
          `<div slTimeRangePicker ${ROOM} [contiguous]="false" [isTimeUnavailable]="isCleaning" [defaultValue]="fromTen"></div>`,
        ),
    ),
  }),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => ({
    props: {
      booking: BOOKING,
      fromNine: FROM_NINE,
      clock: TEN_TWENTY,
      opening: plainTime(8),
      closing: plainTime(20),
      hours: [...HOURS_BEFORE_NOON, ...AFTER_NOON],
    },
    template: grid(
      2,
      scene(
        'Half-hour slots, between eight and twenty',
        'min, max and step shape the list of either end. Type 14:07 into the field: the field still takes any minute, and the value is not invalid for falling between two rows.',
        `<div slTimeRangePicker ${ROOM} [min]="opening" [max]="closing" [step]="1800" [defaultValue]="booking"></div>`,
      ) +
        scene(
          'A stated list',
          'options hands the list the times the room actually opens: on the hour before noon, every half hour after. No step describes that, and none has to.',
          `<div slTimeRangePicker ${ROOM} [options]="hours" [defaultValue]="fromNine"></div>`,
        ),
    ),
  }),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => ({
    props: { clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'One now per end',
        'It is 10:20. Press “Agora”: the start is written, the tab moves to the end, and focus carries to its list, whose rows now say how long a meeting from 10:20 would be. referenceTime fixes the clock for this page.',
        `<div slTimeRangePicker ${ROOM}></div>`,
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: {
      clock: TEN_TWENTY,
      value: AFTERNOON as TimeRange | null,
      morning: MORNING,
      afternoon: AFTERNOON,
      nextHour: (): TimeRange => ({ start: plainTime(11), end: plainTime(12) }),
    },
    template: grid(
      1,
      scene(
        'The slots the office books by name',
        'The afternoon is marked because it is the value. Press “Next hour”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions.',
        `<div slTimeRangePicker ${ROOM} [value]="value" (valueChange)="value = $event.value">
           <div slTimeRangePickerPresets>
             <button [slTimeRangePickerPreset]="morning">Morning</button>
             <button [slTimeRangePickerPreset]="afternoon">Afternoon</button>
             <button [slTimeRangePickerPreset]="nextHour">Next hour</button>
           </div>
           <div slTimeRangePickerFooter>
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
    props: { open: OPEN, clock: TEN_TWENTY },
    template: grid(
      2,
      scene(
        'A start and no end',
        'A value with one end, written where the reader sees it: “14:00 –”. Open the surface: it opens on the end tab, the one to finish, and its first press completes the work. The clear empties both ends at once.',
        `<div slTimeRangePicker clearable ${ROOM} [defaultValue]="open"></div>`,
      ) +
        scene(
          'Both ends required',
          'required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a start alone.',
          `<div slField required>
             <label slFieldLabel>Reserva da sala</label>
             <div slTimeRangePicker ${ROOM}></div>
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { booking: BOOKING, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'The three steps',
        'Type, height, gutter and the clear’s box follow the control scales, so a booking in a dense schedule table shrinks whole rather than in parts.',
        `<div slTimeRangePicker size="sm" clearable ${ROOM} [defaultValue]="booking"></div>
         <div slTimeRangePicker size="md" clearable ${ROOM} [defaultValue]="booking"></div>
         <div slTimeRangePicker size="lg" clearable ${ROOM} [defaultValue]="booking"></div>`,
      ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { booking: BOOKING, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'The three frames',
        'Hover each: the frame answers as one control. Tab to one: the ring is the frame’s, and in plain it is drawn inward, because a plain control’s box belongs to the cell around it.',
        `<div slTimeRangePicker variant="outline" ${ROOM} [defaultValue]="booking"></div>
         <div slTimeRangePicker variant="subtle" ${ROOM} [defaultValue]="booking"></div>
         <div slTimeRangePicker variant="plain" ${ROOM} [defaultValue]="booking"></div>`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { booking: BOOKING, reversed: REVERSED, clock: TEN_TWENTY },
    template: grid(
      2,
      scene(
        'Read-only',
        'The booking is legible and copyable, and the trigger is out of the tab sequence: a surface onto a list nothing answers is worse than no surface.',
        `<div slTimeRangePicker readOnly ${ROOM} [defaultValue]="booking"></div>`,
      ) +
        scene(
          'Disabled',
          'Nothing answers and the times stay readable — a disabled booking still has to say when it is.',
          `<div slTimeRangePicker disabled clearable ${ROOM} [defaultValue]="booking"></div>`,
        ) +
        scene(
          'An end before its start',
          '22:00 to 06:00 is a shift that crosses midnight, and a time has no day: invalid on the end field and on the frame, nothing swapped. The family that writes it is datetime-range-picker.',
          `<div slField>
             <label slFieldLabel>Shift</label>
             <div slTimeRangePicker ${ROOM} [defaultValue]="reversed"></div>
             <span slFieldError>The end must come after the start.</span>
           </div>`,
        ) +
        scene(
          'The consumer’s own word',
          'invalid from the field around it, with a value the family finds nothing wrong with: the server said the room is taken.',
          `<div slField invalid>
             <label slFieldLabel>Room booking</label>
             <div slTimeRangePicker ${ROOM} [defaultValue]="booking"></div>
             <span slFieldError>The room is already booked at that time.</span>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => {
    const control = new FormControl<TimeRange | null>(BOOKING);
    return {
      props: { control, clock: TEN_TWENTY },
      template: grid(
        1,
        scene(
          'A form control',
          'The whole { start, end } is the control’s value, and the family is its validator: an end before the start, a run over the cleaning hour or a booking outside the limits reaches the control’s errors. Choose a booking and read the status.',
          `<div slField>
             <label slFieldLabel>Room booking</label>
             <div slTimeRangePicker ${ROOM} [maxLength]="4 * 3600" [formControl]="control" startName="start" endName="end"></div>
             <span slFieldDescription>
               {{ control.value?.start ? 'Start at ' + control.value?.start?.hour + ':00' : 'No start' }}
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
    props: { booking: BOOKING, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'In a narrow column',
        'The frame stays one line at the control height; a value wider than the column is cut with an ellipsis and the trigger’s name carries it whole. Open it: the surface keeps its own width.',
        measure(`<div slTimeRangePicker clearable ${ROOM} [defaultValue]="booking"></div>`),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { booking: BOOKING, clock: TEN_TWENTY, position: 'start' },
    template: grid(
      1,
      scene(
        'Set once for the application',
        'provideSlotted decides that every booking is in Portuguese, with the office’s own words laid over the catalog, and one defaults provider that it runs in half-hour slots — so a product does not repeat six inputs on each form.',
        `<div slTimeRangePicker [referenceTime]="clock" [defaultValue]="booking"></div>`,
      ) +
        scene(
          'What a row draws',
          'The slTimeRangePickerOption template replaces the row’s content and keeps the row: here each time is followed by the duration the family computed, in the consumer’s own markup.',
          `<div slTimeRangePicker [referenceTime]="clock" [defaultValue]="booking">
             <ng-template slTimeRangePickerOption let-label="label" let-duration="duration">
               {{ label }}
               @if (duration) {
                 <span data-part="option-duration" data-part-option-duration="">{{ duration }}</span>
               }
             </ng-template>
           </div>`,
        ) +
        scene(
          'A template reaches the instance, and owns the end being edited',
          'exportAs hands the directive back: focus, openSurface and closeSurface are reachable from a button beside it. The consumer owns position — which tab — here: press “Edit end” and the surface opens onto the end tab.',
          `<div slTimeRangePicker #picker="slTimeRangePicker" [referenceTime]="clock" [defaultValue]="booking" [position]="position" (positionChange)="position = $event.value"></div>
           <button type="button" (click)="position = 'end'; picker.openSurface()">Edit end</button>
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
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': OFFICE } }),
        provideTimeRangePickerDefaults({ hourCycle: 24, step: 1800 }),
      ],
    }),
  ],
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { booking: BOOKING, clock: TEN_TWENTY },
    template: grid(
      1,
      scene(
        'Two tabs, one list, and the band between them',
        'Tab to the trigger and press ArrowDown: focus lands in the start list on 14:00. Arrow down twice, press Enter: the tab moves to the end and focus carries to its list. Arrow along it — the band says the duration as you go — and press Enter again. Open it once more, Tab to a tab and press ArrowLeft: the other end. Escape abandons the work.',
        `<div slTimeRangePicker ${ROOM} [defaultValue]="booking"></div>`,
      ),
    ),
  }),
};
