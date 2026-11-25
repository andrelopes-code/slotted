import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/date-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { SlDatePicker } from '@slotted/angular/date-picker';",
  selector: '[slDatePicker]',
  exportAs: 'slDatePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The frame of the picker. Carries data-ui="date-picker", data-size, data-variant, data-calendar, data-open and the state attributes.',
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
    purpose:
      'The button that opens the panel. It says aria-haspopup="dialog", and its name carries the date written.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A field that types every date, and a panel that writes one on a press. The controls of the story answer the axes a product sets.',
    snippet: defineSnippet({
      id: 'date-picker-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a value, or a function that resolves one when it is pressed. The panel writes the date each one is, and a shortcut the rules refuse is off.',
    snippet: defineSnippet({
      id: 'date-picker-angular-presets',
      label: 'Shortcuts',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'range-and-set',
    title: 'A run, and a set',
    note: 'selectionMode decides what the value is. A run and a set keep a draft until Apply, because a press does not finish them.',
    snippet: defineSnippet({
      id: 'date-picker-angular-range-and-set',
      label: 'A run, and a set',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="run" selectionMode="range" weekNumbers></div>`,
    }),
  },
  {
    id: 'month',
    title: 'A month as the value',
    note: 'granularity="month" holds a PlainYearMonth: the panel opens on the months of a year, and the bounds are months.',
    snippet: defineSnippet({
      id: 'date-picker-angular-month',
      label: 'A month as the value',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="december" granularity="month"></div>`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'One date is written by its press, and the panel closes. confirm keeps a draft until Apply.',
    snippet: defineSnippet({
      id: 'date-picker-angular-confirm',
      label: 'With and without a confirmation',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth"></div>`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'A day outside the bounds is struck through and keeps its focus. A typed date outside them is invalid.',
    snippet: defineSnippet({
      id: 'date-picker-angular-range-bounds',
      label: 'Bounds',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" [max]="lastDay" [min]="firstDay"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days the product refuses',
    note: 'A predicate refuses particular days. The steps of the head skip them.',
    snippet: defineSnippet({
      id: 'date-picker-angular-unavailable',
      label: 'Days the product refuses',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" [isDateUnavailable]="isWeekend"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'date-picker-angular-sizes',
      label: 'Size',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" size="sm"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'date-picker-angular-variants',
      label: 'Variant',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" variant="outline"></div>`,
    }),
  },
  {
    id: 'placement',
    title: 'Where it opens',
    note: 'A side and an alignment. The positioner turns the panel when there is no room for it.',
    snippet: defineSnippet({
      id: 'date-picker-angular-placement',
      label: 'Where it opens',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" placement="bottom-end"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the field’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'date-picker-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" disabled></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name posts the date, a reset returns to the first one, and a Field names the control and not the panel.',
    snippet: defineSnippet({
      id: 'date-picker-angular-forms',
      label: 'In a form',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Delivery</label>
  <div slDatePicker name="delivery"></div>
</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the shortcuts become a strip over the footer, and on a finger the panel is a sheet.',
    snippet: defineSnippet({
      id: 'date-picker-angular-narrow',
      label: 'One column',
      language: 'angular',
      source: `<div slDatePicker [defaultValue]="thirtieth" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value and the open state, a provider states the shape once, and footer writes what the panel says when nothing is wrong.',
    snippet: defineSnippet({
      id: 'date-picker-angular-composition',
      label: 'Composition and escape hatches',
      language: 'angular',
      source: `<div slDatePicker [value]="date()" (valueChange)="date.set($event.value)">
  <span slDatePickerFooter>Closed on Sundays</span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The field keeps its keys, and the panel adds the calendar’s.',
    snippet: defineSnippet({
      id: 'date-picker-angular-keyboard',
      label: 'The keyboard',
      language: 'angular',
      source: `<!-- Alt + ArrowDown         opens, from a segment -->
<!-- ArrowDown / ArrowUp     on the trigger, opens on the chosen day -->
<!-- Arrows, Home, End       move in the month -->
<!-- PageUp / PageDown       turn the month, and with Shift the year -->
<!-- Enter / Space           chooses -->
<!-- Ctrl + Enter            applies -->
<!-- Escape                  walks down a view, then discards and closes -->
<div slDatePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'SlDatePicker',
    'The value held, which depends on selectionMode. Present means the consumer owns it. Under granularity="month", a PlainYearMonth.',
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | null',
    'null',
    'SlDatePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  ['granularity', "'day' | 'month'", 'day', 'SlDatePicker', 'What a choice is.'],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'SlDatePicker',
    'How many dates the value holds.',
  ],
  [
    'months',
    'number',
    '1',
    'SlDatePicker',
    'How many months the panel shows. One below 760 pixels.',
  ],
  [
    'defaultView',
    "'day' | 'month' | 'year'",
    'day',
    'SlDatePicker',
    'The view the calendar opens on.',
  ],
  ['min', 'PlainDate', '—', 'SlDatePicker', 'The earliest accepted date.'],
  ['max', 'PlainDate', '—', 'SlDatePicker', 'The latest accepted date.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDatePicker',
    'Refuses particular dates.',
  ],
  [
    'presets',
    'readonly PickerPreset<CalendarValue>[]',
    '—',
    'SlDatePicker',
    'The consumer’s own shortcuts, after Today. Without any, the panel is the month alone.',
  ],
  [
    'confirm',
    'boolean',
    'off for one date',
    'SlDatePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlDatePicker',
    'Draws the ISO week number; in a run, a press on it chooses the week.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'SlDatePicker',
    'Six rows whatever the month needs, with one month.',
  ],
  ['firstDayOfWeek', 'number', 'the locale’s', 'SlDatePicker', '0 is Sunday.'],
  ['yearPivot', 'number', '—', 'SlDatePicker', 'How a two-digit typed year resolves.'],
  ['calendar', "'gregory'", 'gregory', 'SlDatePicker', 'The calendar system.'],
  ['name', 'string', '—', 'SlDatePicker', 'The name a form posts the date under.'],
  [
    'invalid',
    'boolean',
    '—',
    'SlDatePicker',
    'Stated by the consumer; a refused date is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDatePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDatePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDatePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDatePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDatePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDatePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'SlDatePicker', 'Which zone answers "what is now".'],
  [
    'today',
    'PlainDate',
    'the clock’s',
    'SlDatePicker',
    'The day it is: the mark of today, Today, and the month an empty panel opens on.',
  ],
  ['disabled', 'boolean', '—', 'SlDatePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'SlDatePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'SlDatePicker', 'The form needs a value.'],
  [
    'clearable',
    'boolean',
    'false',
    'SlDatePicker',
    'Draws a clear on the control and in the panel, unless required.',
  ],
  [
    'messages',
    'Partial<DatePickerMessages>',
    '—',
    'SlDatePicker',
    'Words laid over the language in force: the trigger’s two names, and what is said of a refused date.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<CalendarValue>',
    when: 'Before the value moves, and cancellable: from a key in the field, from a press, from Apply, from Clear.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes, with the reason.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDatePickerDefaults',
    'function',
    '—',
    'application',
    'Sets calendar, confirm, placement, size, timeZone, today and variant once.',
  ],
  [
    'slDatePickerFooter',
    'directive',
    'the page keys',
    'SlDatePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'formControl, ngModel',
    'forms',
    '—',
    'SlDatePicker',
    'The picker is a ControlValueAccessor and a Validator.',
  ],
  [
    'focus(), openSurface(), closeSurface()',
    'methods',
    '—',
    'SlDatePicker',
    'Reached through exportAs.',
  ],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and takes focus to the chosen day.',
  'Escape walks the calendar’s view down before it closes the panel, so a reader in the years is not thrown out of it.',
];

export const ANGULAR_DATE_PICKER_DOCS = {
  datePicker: { accessibility, anatomy, api, composition, events, imports, scenes, snippets: [] },
};
