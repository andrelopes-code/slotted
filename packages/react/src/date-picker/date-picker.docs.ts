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

export const REACT_DATE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { DatePicker, DatePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
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
      id: 'date-picker-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `<DatePicker defaultValue={THIRTIETH} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a value, or a function that resolves one when it is pressed. The panel writes the date each one is, and a shortcut the rules refuse is off.',
    snippet: defineSnippet({
      id: 'date-picker-react-presets',
      label: 'Shortcuts',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'range-and-set',
    title: 'A run, and a set',
    note: 'selectionMode decides what the value is. A run and a set keep a draft until Apply, because a press does not finish them.',
    snippet: defineSnippet({
      id: 'date-picker-react-range-and-set',
      label: 'A run, and a set',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={RUN} selectionMode="range" weekNumbers />;`,
    }),
  },
  {
    id: 'month',
    title: 'A month as the value',
    note: 'granularity="month" holds a PlainYearMonth: the panel opens on the months of a year, and the bounds are months.',
    snippet: defineSnippet({
      id: 'date-picker-react-month',
      label: 'A month as the value',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={plainYearMonth(2026, 12)} granularity="month" />;`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'One date is written by its press, and the panel closes. confirm keeps a draft until Apply.',
    snippet: defineSnippet({
      id: 'date-picker-react-confirm',
      label: 'With and without a confirmation',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} />;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'A day outside the bounds is struck through and keeps its focus. A typed date outside them is invalid.',
    snippet: defineSnippet({
      id: 'date-picker-react-range-bounds',
      label: 'Bounds',
      language: 'tsx',
      source: `<DatePicker
  {...BASE}
  defaultValue={THIRTIETH}
  max={plainDate(2026, 12, 31)}
  min={plainDate(2026, 10, 1)}
/>;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days the product refuses',
    note: 'A predicate refuses particular days. The steps of the head skip them.',
    snippet: defineSnippet({
      id: 'date-picker-react-unavailable',
      label: 'Days the product refuses',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} isDateUnavailable={isWeekend} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'date-picker-react-sizes',
      label: 'Size',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} size="sm" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'date-picker-react-variants',
      label: 'Variant',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} variant="outline" />;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where it opens',
    note: 'A side and an alignment. The positioner turns the panel when there is no room for it.',
    snippet: defineSnippet({
      id: 'date-picker-react-placement',
      label: 'Where it opens',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} placement="bottom-end" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the field’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'date-picker-react-states',
      label: 'States',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} disabled />;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name posts the date, a reset returns to the first one, and a Field names the control and not the panel.',
    snippet: defineSnippet({
      id: 'date-picker-react-forms',
      label: 'In a form',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Delivery</FieldLabel>
  <DatePicker name="delivery" />
</Field>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the shortcuts become a strip over the footer, and on a finger the panel is a sheet.',
    snippet: defineSnippet({
      id: 'date-picker-react-narrow',
      label: 'One column',
      language: 'tsx',
      source: `<DatePicker {...BASE} defaultValue={THIRTIETH} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value and the open state, a provider states the shape once, and footer writes what the panel says when nothing is wrong.',
    snippet: defineSnippet({
      id: 'date-picker-react-composition',
      label: 'Composition and escape hatches',
      language: 'tsx',
      source: `<DatePicker footer="Closed on Sundays" onValueChange={setDate} value={date} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The field keeps its keys, and the panel adds the calendar’s.',
    snippet: defineSnippet({
      id: 'date-picker-react-keyboard',
      label: 'The keyboard',
      language: 'tsx',
      source: `// Alt + ArrowDown         opens, from a segment
// ArrowDown / ArrowUp     on the trigger, opens on the chosen day
// Arrows, Home, End       move in the month
// PageUp / PageDown       turn the month, and with Shift the year
// Enter / Space           chooses
// Ctrl + Enter            applies
// Escape                  walks down a view, then discards and closes`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'DatePicker',
    'The value held, which depends on selectionMode. Present means the consumer owns it. Under granularity="month", a PlainYearMonth.',
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | null',
    'null',
    'DatePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  ['granularity', "'day' | 'month'", 'day', 'DatePicker', 'What a choice is.'],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'DatePicker',
    'How many dates the value holds.',
  ],
  ['months', 'number', '1', 'DatePicker', 'How many months the panel shows. One below 760 pixels.'],
  [
    'defaultView',
    "'day' | 'month' | 'year'",
    'day',
    'DatePicker',
    'The view the calendar opens on.',
  ],
  ['min', 'PlainDate', '—', 'DatePicker', 'The earliest accepted date.'],
  ['max', 'PlainDate', '—', 'DatePicker', 'The latest accepted date.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DatePicker',
    'Refuses particular dates.',
  ],
  [
    'presets',
    'readonly PickerPreset<CalendarValue>[]',
    '—',
    'DatePicker',
    'The consumer’s own shortcuts, after Today. Without any, the panel is the month alone.',
  ],
  [
    'confirm',
    'boolean',
    'off for one date',
    'DatePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'DatePicker',
    'Draws the ISO week number; in a run, a press on it chooses the week.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'true',
    'DatePicker',
    'Six rows whatever the month needs, with one month.',
  ],
  ['firstDayOfWeek', 'number', 'the locale’s', 'DatePicker', '0 is Sunday.'],
  ['yearPivot', 'number', '—', 'DatePicker', 'How a two-digit typed year resolves.'],
  ['calendar', "'gregory'", 'gregory', 'DatePicker', 'The calendar system.'],
  ['name', 'string', '—', 'DatePicker', 'The name a form posts the date under.'],
  [
    'invalid',
    'boolean',
    '—',
    'DatePicker',
    'Stated by the consumer; a refused date is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DatePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DatePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DatePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DatePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DatePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DatePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'DatePicker', 'Which zone answers "what is now".'],
  [
    'today',
    'PlainDate',
    'the clock’s',
    'DatePicker',
    'The day it is: the mark of today, Today, and the month an empty panel opens on.',
  ],
  ['disabled', 'boolean', '—', 'DatePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'DatePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'DatePicker', 'The form needs a value.'],
  [
    'clearable',
    'boolean',
    'false',
    'DatePicker',
    'Draws a clear on the control and in the panel, unless required.',
  ],
  [
    'messages',
    'Partial<DatePickerMessages>',
    '—',
    'DatePicker',
    'Words laid over the language in force: the trigger’s two names, and what is said of a refused date.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: CalendarValue, request: ChangeRequest<CalendarValue>)',
    when: 'Before the value moves, and cancellable: from a key in the field, from a press, from Apply, from Clear.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes, with the reason.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DatePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets calendar, confirm, placement, size, timeZone, today and variant once.',
  ],
  [
    'footer',
    'ReactNode',
    'the page keys',
    'DatePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'render',
    '(props: DatePickerRootProps) => ReactNode',
    '—',
    'DatePicker',
    'Substitutes the element the root renders.',
  ],
  ['ref', 'Ref<DatePickerHandle>', '—', 'DatePicker', 'focus(), open() and close().'],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and takes focus to the chosen day.',
  'Escape walks the calendar’s view down before it closes the panel, so a reader in the years is not thrown out of it.',
];

export const REACT_DATE_PICKER_DOCS = {
  datePicker: { accessibility, anatomy, api, composition, events, imports, scenes, snippets: [] },
};
