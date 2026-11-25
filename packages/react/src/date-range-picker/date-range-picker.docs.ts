import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/date-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATE_RANGE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Range Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { DateRangePicker, DateRangePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame of the picker. Carries data-ui="date-range-picker", data-count, data-size, data-variant, data-open and the state attributes.',
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
    purpose: 'The button that opens the panel. Its name carries both ends and the length written.',
  },
  {
    part: 'start',
    element: 'div',
    required: true,
    purpose:
      'The wrapper of the field of the start, with data-current while it is the end being edited.',
  },
  {
    part: 'separator',
    element: 'span',
    required: true,
    purpose: 'The dash between the two fields.',
  },
  {
    part: 'end',
    element: 'div',
    required: true,
    purpose: 'The wrapper of the field of the end, on the same terms.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose: 'Empties both ends, with clearable and a value.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Two presses draw a run, and the length between the two ends says how long it is while it is drawn. Apply writes it.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `<DateRangePicker defaultValue={STAY} />;`,
    }),
  },
  {
    id: 'length',
    title: 'What the length counts',
    note: 'A stay counts nights and a leave counts days: the same two dates are four or five. The steps of the head move the end one day.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-length',
      label: 'What the length counts',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} count="nights" />;`,
    }),
  },
  {
    id: 'limits',
    title: 'The shortest and the longest run',
    note: 'While a start is chosen, the grid refuses the days outside the limits. A run that is over says by how much, marks its days, and turns Apply off.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-limits',
      label: 'The shortest and the longest run',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} count="nights" maxLength={7} minLength={2} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a run, or a function that resolves one. The panel writes the two ends, and a run the rules refuse is off.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-presets',
      label: 'Shortcuts',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} count="nights" presets={PRESETS} />;`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes the run on the press that closes it.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-confirm',
      label: 'With and without a confirmation',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} />;`,
    }),
  },
  {
    id: 'weeks',
    title: 'Whole weeks',
    note: 'With weekNumbers, a press on the number chooses the week.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-weeks',
      label: 'Whole weeks',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} weekNumbers />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days the product refuses',
    note: 'A run may not cross an unavailable day while contiguous holds, and the grid refuses the days beyond it.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-unavailable',
      label: 'Days the product refuses',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} isDateUnavailable={isTaken} />;`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A start with no end is a value a filter may hold. Opened on its end, the next press closes it.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-open-end',
      label: 'An open end',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultPosition="end" defaultValue={OPEN} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-sizes',
      label: 'Size',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} size="sm" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-variants',
      label: 'Variant',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} variant="outline" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the frame’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-states',
      label: 'States',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} disabled />;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'startName and endName post the two days, a reset returns to the first run, and a Field names the frame and not the panel.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-forms',
      label: 'In a form',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Leave</FieldLabel>
  <DateRangePicker endName="to" startName="from" />
</Field>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the panel shows one month and the shortcuts become a strip over the footer. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-narrow',
      label: 'One column',
      language: 'tsx',
      source: `<DateRangePicker {...BASE} defaultValue={STAY} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, the open state and the end being edited, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-composition',
      label: 'Composition and escape hatches',
      language: 'tsx',
      source: `<DateRangePicker footer="Returns by noon" onValueChange={setRun} value={run} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The fields keep their keys, and the panel adds the calendar’s.',
    snippet: defineSnippet({
      id: 'date-range-picker-react-keyboard',
      label: 'The keyboard',
      language: 'tsx',
      source: `// Alt + ArrowDown         opens, with focus in the field
// ArrowDown / ArrowUp     on the trigger, opens on the current end
// Arrows, Home, End       move in the months
// PageUp / PageDown       turn the month, and with Shift the year
// Enter / Space           opens the run, then closes it
// Ctrl + Enter            applies
// Escape                  walks down a view, then discards and closes`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'DateRange | null',
    '—',
    'DateRangePicker',
    'The run held, either end of which may be null. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'DateRange | null',
    'null',
    'DateRangePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'DateRangePicker',
    'The end the next press writes. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'DateRangePicker', 'The end it starts on.'],
  ['count', "'days' | 'nights'", 'days', 'DateRangePicker', 'What the length counts.'],
  ['minLength', 'number', '—', 'DateRangePicker', 'The shortest run, in the unit count names.'],
  ['maxLength', 'number', '—', 'DateRangePicker', 'The longest run, in the unit count names.'],
  [
    'contiguous',
    'boolean',
    'true',
    'DateRangePicker',
    'Whether a run may cross an unavailable day.',
  ],
  ['min', 'PlainDate', '—', 'DateRangePicker', 'The earliest accepted date.'],
  ['max', 'PlainDate', '—', 'DateRangePicker', 'The latest accepted date.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'DateRangePicker',
    'Refuses particular dates.',
  ],
  [
    'presets',
    'readonly PickerPreset<DateRange>[]',
    '—',
    'DateRangePicker',
    'The consumer’s own shortcuts.',
  ],
  ['confirm', 'boolean', 'true', 'DateRangePicker', 'Whether the panel keeps a draft until Apply.'],
  [
    'months',
    'number',
    '2',
    'DateRangePicker',
    'How many months the panel shows. One below 760 pixels.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'DateRangePicker',
    'Draws the ISO week number, as a press that chooses the week.',
  ],
  ['fixedWeeks', 'boolean', 'false', 'DateRangePicker', 'Six rows whatever the months need.'],
  ['firstDayOfWeek', 'number', 'the locale’s', 'DateRangePicker', '0 is Sunday.'],
  ['yearPivot', 'number', '—', 'DateRangePicker', 'How a two-digit typed year resolves.'],
  ['calendar', "'gregory'", 'gregory', 'DateRangePicker', 'The calendar system.'],
  ['startName', 'string', '—', 'DateRangePicker', 'The name a form posts the start under.'],
  ['endName', 'string', '—', 'DateRangePicker', 'The name a form posts the end under.'],
  [
    'invalid',
    'boolean',
    '—',
    'DateRangePicker',
    'Stated by the consumer; a run that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'DateRangePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'DateRangePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'DateRangePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'DateRangePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'DateRangePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DateRangePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'DateRangePicker', 'Which zone answers "what is now".'],
  [
    'today',
    'PlainDate',
    'the clock’s',
    'DateRangePicker',
    'The day it is: the mark of today, and the month an empty panel opens on.',
  ],
  ['disabled', 'boolean', '—', 'DateRangePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'DateRangePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'DateRangePicker', 'The form needs a value.'],
  [
    'clearable',
    'boolean',
    'false',
    'DateRangePicker',
    'Draws a clear on the control and in the panel, unless required.',
  ],
  [
    'messages',
    'Partial<DateRangePickerMessages>',
    '—',
    'DateRangePicker',
    'Words laid over the language in force: the trigger’s names, the two ends, what is said of a refused run, and the phrases that count it.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: DateRange | null, request: ChangeRequest<DateRange | null>)',
    when: 'Before the value moves, and cancellable: from a key in a field, from Apply, from Clear.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes, with the reason.',
  },
  {
    name: 'onPositionChange',
    payload: '(position: DateRangePickerPosition, request: ChangeRequest<DateRangePickerPosition>)',
    when: 'Before the end being edited moves.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'DateRangePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets calendar, confirm, count, months, placement, size, timeZone, today and variant once.',
  ],
  [
    'footer',
    'ReactNode',
    'the limits',
    'DateRangePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'render',
    '(props: DateRangePickerRootProps) => ReactNode',
    '—',
    'DateRangePicker',
    'Substitutes the element the root renders.',
  ],
  ['ref', 'Ref<DateRangePickerHandle>', '—', 'DateRangePicker', 'focus(), open() and close().'],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and leaves focus in the field, so the segments keep every key they had.',
  'The length between the two halves is a status region, so a reader hears "4 nights" on every arrow as much as they see it on every hover.',
  'The half being edited is a tint and a line, so it is told without color.',
];

export const REACT_DATE_RANGE_PICKER_DOCS = {
  dateRangePicker: {
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
