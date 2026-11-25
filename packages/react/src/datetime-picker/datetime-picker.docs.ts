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

export const REACT_DATETIME_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Datetime Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { DateTimePicker, DateTimePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
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
      id: 'datetime-picker-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `<DateTimePicker defaultValue={DEPARTURE} />;`,
    }),
  },
  {
    id: 'panel',
    title: 'A month beside a clock',
    note: 'Both stand at one height, so neither scrolls. A press on a day with no time yet moves to the clock.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-panel',
      label: 'A month beside a clock',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} defaultOpen />;`,
    }),
  },
  {
    id: 'explicit',
    title: 'Whole times',
    note: 'options states the times there are, under the part of the day each one is in. There is no Now and no step from it.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-explicit',
      label: 'Whole times',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} options={VISITS} />;`,
    }),
  },
  {
    id: 'seconds',
    title: 'Granularity',
    note: 'The finest unit the field and the clock write.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-seconds',
      label: 'Granularity',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} granularity="hour" />;`,
    }),
  },
  {
    id: 'step',
    title: 'Step',
    note: 'Seconds between two offered times. The field still takes a time between two of them.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-step',
      label: 'Step',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} step={300} />;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max bound the whole moment, and minTime and maxTime bound every day inside it. Both hold at once.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-range-bounds',
      label: 'Bounds',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} max={CLOSES} min={OPENS} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days and times the product refuses',
    note: 'A refused day offers no time, and a refused time stays where it is, off.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-unavailable',
      label: 'Days and times the product refuses',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} isDateUnavailable={isSaturday} />;`,
    }),
  },
  {
    id: 'offsets',
    title: 'Steps from now',
    note: 'Seconds from the moment it is. A step the rules refuse is off, and an empty list draws none.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-offsets',
      label: 'Steps from now',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} offsets={[43200, 172800]} />;`,
    }),
  },
  {
    id: 'relative',
    title: 'Typing a step',
    note: 'In the field, plus and minus open an expression: +2h writes two hours from now.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-relative',
      label: 'Typing a step',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} relative />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a moment, or a function that resolves one. The panel writes the moment under the label, after Now.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-presets',
      label: 'Shortcuts',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes a whole moment on every press, and closes on the one that completes it.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-confirm',
      label: 'With and without a confirmation',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-sizes',
      label: 'Size',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} size="sm" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-variants',
      label: 'Variant',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} variant="outline" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the field’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-states',
      label: 'States',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} disabled />;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'name posts the moment, a reset returns to the first one, and a Field names the control and not the panel.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-forms',
      label: 'In a form',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Departure</FieldLabel>
  <DateTimePicker name="departure" />
</Field>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the panel shows the month or the clock, and the two heads bring them. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-narrow',
      label: 'One column',
      language: 'tsx',
      source: `<DateTimePicker {...BASE} defaultValue={DEPARTURE} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value and the open state, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-composition',
      label: 'Composition and escape hatches',
      language: 'tsx',
      source: `<DateTimePicker footer="Doors close at 6" onValueChange={setMoment} value={moment} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The field keeps its keys, and the panel adds the calendar’s and the clock’s.',
    snippet: defineSnippet({
      id: 'datetime-picker-react-keyboard',
      label: 'The keyboard',
      language: 'tsx',
      source: `// Alt + ArrowDown         opens, with focus in the field
// ArrowDown / ArrowUp     on the trigger, opens on the chosen day
// Arrows, Home, End       move in the month, and in each grid of the clock
// PageUp / PageDown       turn the month, and with Shift the year
// Enter / Space           chooses the day, the hour or the minute
// Ctrl + Enter            applies
// Escape                  walks down a view, then discards and closes`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDateTime | null',
    '—',
    'DateTimePicker',
    'The moment held. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'PlainDateTime | null',
    'null',
    'DateTimePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  ['min', 'PlainDateTime', '—', 'DateTimePicker', 'The earliest accepted moment.'],
  ['max', 'PlainDateTime', '—', 'DateTimePicker', 'The latest accepted moment.'],
  [
    'minTime',
    'PlainTime',
    '—',
    'DateTimePicker',
    'The earliest time of every day inside the range.',
  ],
  ['maxTime', 'PlainTime', '—', 'DateTimePicker', 'The latest time of every day inside the range.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateTimePicker',
    'Refuses particular dates.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'DateTimePicker',
    'Refuses particular times of a day.',
  ],
  [
    'step',
    'number',
    '900',
    'DateTimePicker',
    'Seconds between two offered times, counted from the first of the day.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'DateTimePicker',
    'The times there are, stated rather than stepped.',
  ],
  [
    'presets',
    'readonly PickerPreset<PlainDateTime>[]',
    '—',
    'DateTimePicker',
    'The consumer’s own shortcuts, after Now.',
  ],
  [
    'offsets',
    'readonly number[]',
    '[3600, 14400, 86400]',
    'DateTimePicker',
    'Steps from now, in seconds. An empty list draws none.',
  ],
  ['confirm', 'boolean', 'true', 'DateTimePicker', 'Whether the panel keeps a draft until Apply.'],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'DateTimePicker',
    'The finest unit written.',
  ],
  ['hourCycle', '12 | 24', 'the locale’s', 'DateTimePicker', 'The clock the moment is written on.'],
  [
    'referenceDateTime',
    'PlainDateTime',
    'now',
    'DateTimePicker',
    'The moment it is: what an empty field steps from, and what the panel counts distances and steps from.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'DateTimePicker',
    'Whether + and - open the duration expression in the field.',
  ],
  ['weekNumbers', 'boolean', 'false', 'DateTimePicker', 'Draws the ISO week number.'],
  ['firstDayOfWeek', 'number', 'the locale’s', 'DateTimePicker', '0 is Sunday.'],
  ['calendar', "'gregory'", 'gregory', 'DateTimePicker', 'The calendar system.'],
  ['name', 'string', '—', 'DateTimePicker', 'The name a form posts the moment under.'],
  [
    'invalid',
    'boolean',
    '—',
    'DateTimePicker',
    'Stated by the consumer; a moment that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DateTimePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DateTimePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DateTimePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DateTimePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateTimePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DateTimePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'DateTimePicker', 'Which zone answers "what is now".'],
  [
    'today',
    'PlainDate',
    'the clock’s',
    'DateTimePicker',
    'The day it is: the mark of today, the date of Now, and the empty panel’s month.',
  ],
  ['disabled', 'boolean', '—', 'DateTimePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'DateTimePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'DateTimePicker', 'The form needs a value.'],
  [
    'clearable',
    'boolean',
    'false',
    'DateTimePicker',
    'Draws a clear on the control and in the panel, unless required.',
  ],
  [
    'messages',
    'Partial<DatetimePickerMessages>',
    '—',
    'DateTimePicker',
    'Words laid over the language in force: the trigger’s names, and what is said of a refused moment.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: PlainDateTime | null, request: ChangeRequest<PlainDateTime | null>)',
    when: 'Before the value moves, and cancellable: from a key in the field, from Apply, from Clear.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes, with the reason.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateTimePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets calendar, confirm, granularity, hourCycle, placement, size, step, timeZone, today and variant once.',
  ],
  [
    'footer',
    'ReactNode',
    'the step',
    'DateTimePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'renderSlot',
    '(state: ClockSlotState) => ReactNode',
    'the time',
    'DateTimePicker',
    'What one whole time of options draws.',
  ],
  [
    'render',
    '(props: DateTimePickerRootProps) => ReactNode',
    '—',
    'DateTimePicker',
    'Substitutes the element the root renders.',
  ],
  ['ref', 'Ref<DateTimePickerHandle>', '—', 'DateTimePicker', 'focus(), open() and close().'],
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

export const REACT_DATETIME_PICKER_DOCS = {
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
