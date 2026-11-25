import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/datetime-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATETIME_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Datetime Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { SlDateTimePicker } from '@slotted/angular/datetime-picker';",
  selector: '[slDateTimePicker]',
  exportAs: 'slDateTimePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The frame of the picker. Carries data-ui="datetime-picker", data-granularity, data-size, data-variant, data-open and the state attributes.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose: 'The box the panel hangs from, around the field and the trigger.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose: 'The button that opens the panel. Its name carries the moment written.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A day and a time are two presses. The day is written in words over the month, the time is typed or pressed, and Apply writes both.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure"></div>`,
    }),
  },
  {
    id: 'panel',
    title: 'A month beside a clock',
    note: 'Both stand at one height, so neither scrolls. A press on a day with no time yet moves to the clock.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-panel',
      label: 'A month beside a clock',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" defaultOpen></div>`,
    }),
  },
  {
    id: 'explicit',
    title: 'Whole times',
    note: 'options states the times there are, under the part of the day each one is in. There is no Now and no step from it.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-explicit',
      label: 'Whole times',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [options]="visits"></div>`,
    }),
  },
  {
    id: 'seconds',
    title: 'Granularity',
    note: 'The finest unit the field and the clock write.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-seconds',
      label: 'Granularity',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" granularity="hour"></div>`,
    }),
  },
  {
    id: 'step',
    title: 'Step',
    note: 'Seconds between two offered times. The field still takes a time between two of them.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-step',
      label: 'Step',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" step="300"></div>`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max bound the whole moment, and minTime and maxTime bound every day inside it. Both hold at once.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-range-bounds',
      label: 'Bounds',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [max]="closes" [min]="opens"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days and times the product refuses',
    note: 'A refused day offers no time, and a refused time stays where it is, off.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-unavailable',
      label: 'Days and times the product refuses',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [isDateUnavailable]="isSaturday"></div>`,
    }),
  },
  {
    id: 'offsets',
    title: 'Steps from now',
    note: 'Seconds from the moment it is. A step the rules refuse is off, and an empty list draws none.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-offsets',
      label: 'Steps from now',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [offsets]="[43200, 172800]"></div>`,
    }),
  },
  {
    id: 'relative',
    title: 'Typing a step',
    note: 'In the field, plus and minus open an expression: +2h writes two hours from now.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-relative',
      label: 'Typing a step',
      language: 'angular',
      source: `<div slDateTimePicker relative></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a moment, or a function that resolves one. The panel writes the moment under the label, after Now.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-presets',
      label: 'Shortcuts',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes a whole moment on every press, and closes on the one that completes it.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-confirm',
      label: 'With and without a confirmation',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-sizes',
      label: 'Size',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" size="sm"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-variants',
      label: 'Variant',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" variant="outline"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the field’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" disabled></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name posts the moment, a reset returns to the first one, and a Field names the control and not the panel.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-forms',
      label: 'In a form',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Departure</label>
  <div slDateTimePicker name="departure"></div>
</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the panel shows the month or the clock, and the two heads bring them. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-narrow',
      label: 'One column',
      language: 'angular',
      source: `<div slDateTimePicker [defaultValue]="departure" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value and the open state, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-composition',
      label: 'Composition and escape hatches',
      language: 'angular',
      source: `<div slDateTimePicker [value]="moment()" (valueChange)="moment.set($event.value)">
  <span slDateTimePickerFooter>Doors close at 6</span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The field keeps its keys, and the panel adds the calendar’s and the clock’s.',
    snippet: defineSnippet({
      id: 'datetime-picker-angular-keyboard',
      label: 'The keyboard',
      language: 'angular',
      source: `<!-- Alt + ArrowDown         opens, with focus in the field -->
<!-- ArrowDown / ArrowUp     on the trigger, opens on the chosen day -->
<!-- Arrows, Home, End       move in the month, and in each grid of the clock -->
<!-- PageUp / PageDown       turn the month, and with Shift the year -->
<!-- Enter / Space           chooses the day, the hour or the minute -->
<!-- Ctrl + Enter            applies -->
<!-- Escape                  walks down a view, then discards and closes -->
<div slDateTimePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDateTime | null',
    '—',
    'SlDateTimePicker',
    'The moment held. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    'null',
    'SlDateTimePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  ['min', 'PlainDateTime', '—', 'SlDateTimePicker', 'The earliest accepted moment.'],
  ['max', 'PlainDateTime', '—', 'SlDateTimePicker', 'The latest accepted moment.'],
  [
    'minTime',
    'PlainTime',
    '—',
    'SlDateTimePicker',
    'The earliest time of every day inside the range.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'SlDateTimePicker',
    'The latest time of every day inside the range.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateTimePicker',
    'Refuses particular dates.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'SlDateTimePicker',
    'Refuses particular times of a day.',
  ],
  [
    'step',
    'number',
    '900',
    'SlDateTimePicker',
    'Seconds between two offered times, counted from the first of the day.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlDateTimePicker',
    'The times there are, stated rather than stepped.',
  ],
  [
    'presets',
    'readonly PickerPreset<PlainDateTime>[]',
    '—',
    'SlDateTimePicker',
    'The consumer’s own shortcuts, after Now.',
  ],
  [
    'offsets',
    'readonly number[]',
    '[3600, 14400, 86400]',
    'SlDateTimePicker',
    'Steps from now, in seconds. An empty list draws none.',
  ],
  [
    'confirm',
    'boolean',
    'true',
    'SlDateTimePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlDateTimePicker',
    'The finest unit written.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'SlDateTimePicker',
    'The clock the moment is written on.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'now',
    'SlDateTimePicker',
    'The moment it is: what an empty field steps from, and what the panel counts distances and steps from.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlDateTimePicker',
    'Whether + and - open the duration expression in the field.',
  ],
  ['weekNumbers', 'boolean', 'false', 'SlDateTimePicker', 'Draws the ISO week number.'],
  ['firstDayOfWeek', 'number', 'the locale’s', 'SlDateTimePicker', '0 is Sunday.'],
  ['calendar', "'gregory'", 'gregory', 'SlDateTimePicker', 'The calendar system.'],
  ['name', 'string', '—', 'SlDateTimePicker', 'The name a form posts the moment under.'],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateTimePicker',
    'Stated by the consumer; a moment that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDateTimePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDateTimePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDateTimePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateTimePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateTimePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDateTimePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'SlDateTimePicker', 'Which zone answers "what is now".'],
  ['disabled', 'boolean', '—', 'SlDateTimePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'SlDateTimePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'SlDateTimePicker', 'The form needs a value.'],
  ['clearable', 'boolean', 'false', 'SlDateTimePicker', 'Draws a clear on the control.'],
  [
    'messages',
    'Partial<DatetimePickerMessages>',
    '—',
    'SlDateTimePicker',
    'Words laid over the language in force: the trigger’s names, and what is said of a refused moment.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<PlainDateTime | null>',
    when: 'Before the value moves, and cancellable: from a key in the field, from Apply, from Clear.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes, with the reason.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateTimePickerDefaults',
    'function',
    '—',
    'application',
    'Sets calendar, confirm, granularity, hourCycle, placement, size, step, timeZone and variant once.',
  ],
  [
    'slDateTimePickerFooter',
    'directive',
    'the step',
    'SlDateTimePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'slClockSlot',
    'template',
    'the time',
    'SlDateTimePicker',
    'What one whole time of options draws.',
  ],
  [
    'formControl, ngModel',
    'forms',
    '—',
    'SlDateTimePicker',
    'The picker is a ControlValueAccessor and a Validator.',
  ],
  [
    'focus(), openSurface(), closeSurface()',
    'methods',
    '—',
    'SlDateTimePicker',
    'Reached through exportAs.',
  ],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and leaves focus in the field, so the segments keep every key they had.',
  'The clock answers the day in the draft, so a reader who moves to a closed day hears its hours as unavailable before they choose one.',
  'Under 760 pixels each head is a button with aria-expanded, so the part that is not on screen is announced as collapsed and not as missing.',
];

export const ANGULAR_DATETIME_PICKER_DOCS = {
  dateTimePicker: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [],
  },
};
