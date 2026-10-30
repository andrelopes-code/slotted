import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDateTimePicker } from './datetime-picker';
import type {
  DateTimePickerCloseOnSelect,
  DateTimePickerOpenTo,
  DateTimePickerPlacement,
  DateTimePickerSize,
  DateTimePickerVariant,
} from './datetime-picker-defaults';
import {
  SlDateTimePickerFooter,
  SlDateTimePickerOption,
  SlDateTimePickerPresets,
} from './datetime-picker-parts';
import {
  ANGULAR_DATETIME_PICKER_DOCS,
  ANGULAR_DATETIME_PICKER_TOKENS,
} from './datetime-picker.docs';

interface DateTimePickerStoryArgs {
  clearable: boolean;
  closeOnSelect: DateTimePickerCloseOnSelect;
  locale: string;
  openTo: DateTimePickerOpenTo;
  placement: DateTimePickerPlacement;
  size: DateTimePickerSize;
  step: number;
  variant: DateTimePickerVariant;
}

/** A consultation on a Thursday afternoon, and the clinic it belongs to. */
const CONSULTATION: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every scene reads the same twice. */
const REFERENCE: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(14, 40));

const CLINIC = {
  max: plainDateTime(plainDate(2026, 12, 20), plainTime(12, 0)),
  maxTime: plainTime(18, 0),
  min: plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0)),
  minTime: plainTime(9, 0),
};

/** A clinic's own hours: no step describes them, and `options` states them. */
const HOURS: PlainTime[] = [
  plainTime(9, 0),
  plainTime(9, 20),
  plainTime(11, 40),
  plainTime(13, 45),
  plainTime(16, 0),
];

const isSaturday = (date: PlainDate) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 6;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATETIME_PICKER_DOCS.dateTimePicker.scenes, {
    playground: Playground,
    panel: Panel,
    'open-to': OpenTo,
    completeness: Completeness,
    seconds: Seconds,
    step: Step,
    'range-bounds': RangeBounds,
    'day-window': DayWindow,
    unavailable: Unavailable,
    now: Now,
    relative: Relative,
    presets: Presets,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlDateTimePicker,
  SlDateTimePickerFooter,
  SlDateTimePickerOption,
  SlDateTimePickerPresets,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<DateTimePickerStoryArgs> = {
  title: 'Components/DateTimePicker',
  component: SlDateTimePicker,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DateTime Picker',
        description:
          'The only family in the library that holds two surfaces at once: a month and a list of times, inside one dialog, over a field that still types every segment. The decision it owes is which of the two focus opens on — and what happens to the other when the reader finishes the first. The answer is the value’s own completeness: the press that leaves it half written carries focus to the missing half, and the press that finishes it closes the panel.',
        framework: 'Angular',
        ...ANGULAR_DATETIME_PICKER_DOCS.dateTimePicker,
        tokens: ANGULAR_DATETIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateTimePickerStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
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

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

/**
 * Every open panel needs room under it, and the stage is what gives it. This
 * one holds a month and a column of times, so it is a screen rather than the
 * tall box a single listbox needs.
 */
const stage = (body: string) =>
  `<div class="slotted-demo-viewport" data-size="screen">${body}</div>`;

/** The two pairs of bounds, written once for the scenes that need them. */
const BOUNDS = '[min]="min" [max]="max" [minTime]="minTime" [maxTime]="maxTime"';

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    locale: 'pt-BR',
    openTo: 'date',
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, reference: REFERENCE },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Appointment start</label>
          <div
            slDateTimePicker
            name="start"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [openTo]="openTo"
            [closeOnSelect]="closeOnSelect"
            [step]="step"
            [clearable]="clearable"
            [referenceDateTime]="reference"
          ></div>
          <span slFieldDescription>Choose in the panel or type in the field.</span>
        </div>
      </div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      1,
      scene(
        'One dialog, two surfaces',
        'A grid that SlCalendar draws and a listbox that this family draws, side by side inside the same role=dialog. Both are in the DOM at any width: a tablist that exists in a narrow container and not in a wide one tells two different stories of the same component to assistive technology.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Start"
             [step]="1800"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ),
    ),
  }),
};

export const OpenTo: Story = {
  parameters: scenario('open-to'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'Focus opens on the date',
        'The default, and the order in which the value itself reads. The reader arrives at the day of the value, with the roving focus of the calendar already in place.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             openTo="date"
             aria-label="Abre na data"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'Focus opens on the time',
          'For a schedule whose day is already decided. openTo decides the focus and not the drawing: both surfaces remain present, because moving a whole month because of a setting would make the same family look like two.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               openTo="time"
               aria-label="Abre na hora"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Completeness: Story = {
  parameters: scenario('completeness'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'Half written: focus goes to the missing one',
        'A day chosen over an empty field leaves the value unfinished, and the panel stays — with focus already on the list. The band at the top says what the reader has so far, and draws the missing half as a placeholder.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             closeOnSelect="auto"
             aria-label="Por acabar"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'Whole value: the panel closes',
          'The press that completes the value closes the panel and returns focus to the trigger, whose accessible name carries what was chosen. It is the reason this family does not need the needConfirm of Ant or the Set of Kendo.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               closeOnSelect="auto"
               aria-label="Fecha ao completar"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ) +
        scene(
          'always',
          'Any press that changes the value closes the panel, even when it was already whole. For a flow where changing the day is a decision and not an exploration.',
          `<div
             slDateTimePicker
             locale="pt-BR"
             closeOnSelect="always"
             aria-label="Sempre"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ) +
        scene(
          'never',
          'The panel closes only on Escape, on a press outside it or on the trigger. For a panel embedded in a form that confirms elsewhere — the footer slot exists for that.',
          `<div
             slDateTimePicker
             locale="pt-BR"
             closeOnSelect="never"
             aria-label="Nunca"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
    ),
  }),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => ({
    props: {
      value: plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 30)),
      reference: REFERENCE,
      from: plainTime(15, 20),
      to: plainTime(15, 25),
    },
    template: grid(
      1,
      scene(
        'Half a minute inside a window',
        'The field writes every second and the list offers a 30-second step — eleven rows inside a bounded window, and not the 86,400 that a whole day would be. The guard is on the length of the list, maxOptions, and never on the size of the step.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             granularity="second"
             defaultOpen
             aria-label="Segundos"
             [step]="30"
             [minTime]="from"
             [maxTime]="to"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ),
    ),
  }),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => ({
    props: {
      base: plainDateTime(plainDate(2026, 9, 10), plainTime(9, 7)),
      ceiling: plainDateTime(plainDate(2026, 9, 12), plainTime(11, 0)),
      hours: HOURS,
      chosen: plainDateTime(plainDate(2026, 9, 10), plainTime(11, 40)),
      reference: REFERENCE,
    },
    template: grid(
      2,
      scene(
        'Counted from the lower bound',
        'min at 09:07 with a fifteen-minute step offers 09:07, 09:22, 09:37 — the rule of the platform itself for input[type=time], which no surveyed panel states.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Base"
             [min]="base"
             [max]="ceiling"
             [step]="900"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'Times that no step describes',
          '09:00, 09:20, 11:40, 13:45, 16:00. options states them in the order of the consumer, and the field beside it keeps accepting any hour between two rows.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               aria-label="Clinic hours"
               [options]="hours"
               [defaultValue]="chosen"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => ({
    props: {
      ...CLINIC,
      firstDay: plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0)),
      middleDay: plainDateTime(plainDate(2026, 9, 15), plainTime(10, 0)),
      reference: REFERENCE,
    },
    template: grid(
      2,
      scene(
        'The first day is partial',
        'On the day of min itself the list starts at min and not at minTime: September 11 opens at 14:00 and not at 09:00. Both pairs hold at the same time, and this combination is what the MUI validation page records it cannot deliver.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="First day"
             ${BOUNDS}
             [step]="3600"
             [defaultValue]="firstDay"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'A middle day runs the whole window',
          'September 15 runs from 09:00 to 18:00 — the window that repeats every day inside the range. The day of max runs until 12:00 and stops there, and neither bound needs to be rewritten per day.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               aria-label="Dia do meio"
               ${BOUNDS}
               [step]="3600"
               [defaultValue]="middleDay"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => ({
    props: {
      closesEarly: (time: PlainTime, date: PlainDate) => isSaturday(date) && time.hour >= 13,
      closedAllDay: (_time: PlainTime, date: PlainDate) => isSaturday(date),
      saturday: plainDateTime(plainDate(2026, 9, 12), plainTime(10, 0)),
      reference: REFERENCE,
    },
    template: grid(
      2,
      scene(
        'Saturday closes at 13:00',
        'The list answers to the day where the reader is, and not to the day already chosen. Walk the month with the arrows and the column recalculates under the cursor. The disabledTime(date) of Ant is only called for a date already confirmed, and cannot say this.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Saturday"
             [isTimeUnavailable]="closesEarly"
             [step]="3600"
             [defaultValue]="saturday"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'A day with no hours at all',
          'A sentence instead of an empty box. MUI draws nothing here and Ant draws an empty column, and both read as a broken component.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               unavailableOptions="hide"
               [messages]="{ empty: 'No time available on this day.' }"
               aria-label="Closed day"
               [isTimeUnavailable]="closedAllDay"
               [step]="3600"
               [defaultValue]="saturday"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: {
      isLunch: (time: PlainTime) => time.hour === 12,
      value: CONSULTATION,
      reference: REFERENCE,
    },
    template: grid(
      2,
      scene(
        'Disable: the default',
        'The lunch hour stays in the list, refused and legible. A list that silently deletes rows is a list whose step the reader cannot infer.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             unavailableOptions="disable"
             aria-label="Lunch disabled"
             [isTimeUnavailable]="isLunch"
             [step]="1800"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'Hide: the choice of the consumer',
          'For a schedule with dozens of refused rows, where the noise costs more than the step. A whole day with no hours keeps receiving the sentence and not an empty column.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               unavailableOptions="hide"
               aria-label="Lunch hidden"
               [isTimeUnavailable]="isLunch"
               [step]="1800"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => ({
    props: { reference: REFERENCE },
    template: grid(
      1,
      scene(
        'One press, both halves',
        'Now writes the date and time at once, and is the zero case of the relative expression of the field itself — drawn as a labeled control, for the reader who never discovers that + opens one. It carries the clock, which is the second of the two marks of the family.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             [messages]="{ now: 'Agora' }"
             aria-label="Agora"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ),
    ),
  }),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => ({
    props: { reference: REFERENCE },
    template: grid(
      1,
      scene(
        'Typing with the panel open',
        'Alt+Down Arrow opens the panel and leaves focus in the field, so every key the segments had keeps working — including +, which opens the duration expression. Escape is staged: it abandons the expression first, and the panel stays.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Expression"
             [relative]="true"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: { reference: REFERENCE },
    template: grid(
      1,
      scene(
        'Consumer shortcuts',
        'They sit in the top band, beside Now, and wrap inside the width of the panel instead of stretching it: the band is drawn at the width of the panel and contributes nothing to it. This family ships no list of its own — “tomorrow at nine” is a business clock, and guessing it would be guessing an industry.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Com atalhos"
             [referenceDateTime]="reference"
           >
             <div slDateTimePickerPresets>
               <button type="button">Tomorrow 09:00</button>
               <button type="button">Monday 14:00</button>
             </div>
           </div>`,
        ),
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'The three steps of the control',
        'Type, height and inner padding, and the trigger box follows each. A picker inside a field takes the step of the field.',
        `<div slDateTimePicker locale="pt-BR" size="sm" aria-label="Small" [defaultValue]="value"></div>
         <div slDateTimePicker locale="pt-BR" size="md" aria-label="Default" [defaultValue]="value"></div>
         <div slDateTimePicker locale="pt-BR" size="lg" aria-label="Large" [defaultValue]="value"></div>`,
      ) +
        scene(
          'The panel follows the step',
          'The rows of the list and the ceiling of the column come down together, so that a dense panel does not end up with eleven rows of one height and the same number of visible rows.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               size="sm"
               defaultOpen
               aria-label="Small panel"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'outline and subtle',
        'The frame is that of the field, so a form with a name and a datetime shows the same frame twice. subtle swaps the border for a surface.',
        `<div slDateTimePicker locale="pt-BR" variant="outline" aria-label="Outline" [defaultValue]="value"></div>
         <div slDateTimePicker locale="pt-BR" variant="subtle" aria-label="Subtle" [defaultValue]="value"></div>`,
      ) +
        scene(
          'plain',
          'Nothing until used, which is what a dense table of time entries needs. Focus and hover are still drawn, because an invisible control that does not respond is not a control.',
          `<div slDateTimePicker locale="pt-BR" variant="plain" size="sm" aria-label="Check-in" [defaultValue]="value"></div>
           <div slDateTimePicker locale="pt-BR" variant="plain" size="sm" aria-label="Check-out" [defaultValue]="value"></div>`,
          'row',
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'Below, aligned to the start',
        'The default. The layer arrives along the axis it opens on and never along the inline axis, and data-placement says what the positioner resolved.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             placement="bottom-start"
             aria-label="Em baixo"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ) +
        scene(
          'A preference the positioner flips',
          'Here the control asks for top-start and has no room at all above it inside this box, so the layer resolves below and data-placement says bottom-start. The preference is a request and not a guarantee.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               placement="top-start"
               aria-label="Em cima"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'Read-only and disabled',
        'Read-only stays focusable and copyable and never looks like disabled; the trigger stays, and does not open. Disabled answers to no key and no pointer, and the trigger is a disabled button.',
        `<div slDateTimePicker locale="pt-BR" readOnly aria-label="Read-only" [defaultValue]="value"></div>
         <div slDateTimePicker locale="pt-BR" disabled aria-label="Disabled" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Required and invalid',
          'Required reaches the field group as aria-required. Invalid keeps the focus ring and changes its color — and stays invalid when the value falls outside either of the two pairs of bounds.',
          `<div slDateTimePicker locale="pt-BR" required aria-label="Required" [defaultValue]="value"></div>
           <div slDateTimePicker locale="pt-BR" invalid aria-label="Invalid" [defaultValue]="value"></div>`,
        ) +
        scene(
          'Chosen, current and pointed',
          'In the list, the chosen row beats the highlight, the highlight beats the pointer, and each weaker rule is guarded by specificity and not by writing order.',
          stage(
            `<div
               slDateTimePicker
               locale="pt-BR"
               defaultOpen
               openTo="time"
               aria-label="Estados da lista"
               [step]="1800"
               [defaultValue]="value"
               [referenceDateTime]="reference"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: {
      form: new FormGroup({
        start: new FormControl<PlainDateTime | null>(CONSULTATION),
      }),
      reference: REFERENCE,
    },
    template: grid(
      1,
      scene(
        'A reactive form',
        'The picker writes the same control that a bare datetime-field would write, so formControlName works on the picker without a second accessor — and the value also reaches a plain form post as YYYY-MM-DDTHH:mm:ss.',
        `<form [formGroup]="form">
           <div slField>
             <label slFieldLabel>Appointment start</label>
             <div
               slDateTimePicker
               locale="pt-BR"
               formControlName="start"
               name="start"
               required
               [referenceDateTime]="reference"
             ></div>
             <span slFieldDescription>Control value: {{ form.value.start | json }}</span>
           </div>
         </form>`,
      ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'The control under 320 pixels',
        'The row of seven fields breaks between the two halves and never inside one, and the trigger stays where it was: at the end of the field, on the reading side.',
        measure(
          `<div slDateTimePicker locale="pt-BR" aria-label="Narrow" [defaultValue]="value"></div>`,
        ),
      ) +
        scene(
          'The panel in a column',
          'The two surfaces break in the order of the value itself, with nothing hidden and no switch drawn. The column of hours takes the whole row where it falls, so that it reads as a section and not as a strip.',
          stage(
            measure(
              `<div
                 slDateTimePicker
                 locale="pt-BR"
                 defaultOpen
                 aria-label="Narrow panel"
                 [defaultValue]="value"
                 [referenceDateTime]="reference"
               ></div>`,
            ),
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      2,
      scene(
        'A row drawn by the consumer',
        'An ng-template marked with slDateTimePickerOption draws what is inside the row, through NgTemplateOutlet; the row stays part of the family — the role, the states, the keyboard and the touch target.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             openTo="time"
             aria-label="Custom row"
             [step]="1800"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           >
             <ng-template slDateTimePickerOption let-time let-label="label" let-selected="selected">
               <span>{{ label }}</span>
               @if (selected) {
                 <span>·</span>
               }
             </ng-template>
           </div>`,
        ),
      ) +
        scene(
          'The instance a template reaches, and a footer',
          'exportAs gives the template the component itself: focus() puts the reader on the first segment of the field, and openSurface() and closeSurface() move the panel without a press. The footer belongs to the consumer — the family needs none, because the completeness of the value closes the panel.',
          `<div
             slDateTimePicker
             #start="slDateTimePicker"
             locale="pt-BR"
             closeOnSelect="never"
             aria-label="With instance"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           >
             <div slDateTimePickerFooter>
               <button type="button">Confirmar</button>
             </div>
           </div>
           <button type="button" (click)="start.focus()">Focus</button>
           <button type="button" (click)="start.openSurface()">Open</button>
           <button type="button" (click)="start.closeSurface()">Close</button>`,
          'row',
          40,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { value: CONSULTATION, reference: REFERENCE },
    template: grid(
      1,
      scene(
        'Two Tab stops, not forty-three',
        'Only one element of the grid is in the Tab sequence, as the grid pattern requires, and the listbox is a stop for the same reason; with the panel open, Tab stays contained inside the layer. Alt+Down Arrow opens the panel from a segment and leaves focus in the field; from the trigger, Down Arrow opens it and takes focus to the surface that openTo names. Inside the list: the arrows, Home, End, type-ahead, and PageUp and PageDown across an hour boundary.',
        stage(
          `<div
             slDateTimePicker
             locale="pt-BR"
             defaultOpen
             aria-label="Teclado"
             [defaultValue]="value"
             [referenceDateTime]="reference"
           ></div>`,
        ),
      ),
    ),
  }),
};
