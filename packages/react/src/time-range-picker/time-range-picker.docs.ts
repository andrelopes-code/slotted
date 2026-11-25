import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/time-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TIME_RANGE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Range Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { TimeRangePicker, TimeRangePickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame of the picker. Carries data-ui="time-range-picker", data-granularity, data-size, data-variant, data-open and the state attributes.',
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
      'The button that fills the frame and opens the panel. Its name carries both ends and the length written.',
  },
  {
    part: 'summary',
    element: 'span',
    required: true,
    purpose: 'The run in words, one line, or the placeholder with data-placeholder.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose: 'Empties both ends, with clearable and a value.',
  },
  {
    part: 'hidden-input',
    element: 'input',
    required: true,
    purpose: 'One for each end, posted under startName and endName.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Both ends, the length between them and the day are on screen. Press, type, drag a handle or step the length; Apply writes the run.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `<TimeRangePicker defaultValue={BOOKING} />;`,
    }),
  },
  {
    id: 'panel',
    title: 'The day and two clocks',
    note: 'The clock of the end refuses what the start refuses of it, in the gesture that chooses the start.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-panel',
      label: 'The day and two clocks',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} defaultOpen />;`,
    }),
  },
  {
    id: 'length',
    title: 'The length',
    note: 'One step of the clock either way, between the two ends. lengthLabel writes it in the product’s own words.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-length',
      label: 'The length',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} />;`,
    }),
  },
  {
    id: 'durations',
    title: 'Durations',
    note: 'Lengths the run takes from its start. One past midnight, or refused, is off, and an empty list draws none.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-durations',
      label: 'Durations',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} durations={[1800, 3600, 14400]} />;`,
    }),
  },
  {
    id: 'limits',
    title: 'The shortest and the longest run',
    note: 'In seconds, the unit step is written in. A run that is over says by how much, and Apply is off.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-limits',
      label: 'The shortest and the longest run',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} maxLength={14400} minLength={1800} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'A run may not cross an unavailable time while contiguous holds.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-unavailable',
      label: 'Times the product refuses',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} isTimeUnavailable={isNoon} />;`,
    }),
  },
  {
    id: 'step',
    title: 'Step',
    note: 'Seconds between two offered times, in both clocks, on the day and in the step of the length.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-step',
      label: 'Step',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} step={300} />;`,
    }),
  },
  {
    id: 'explicit',
    title: 'Whole times',
    note: 'options states the times there are, for both ends, under the part of the day each one is in.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-explicit',
      label: 'Whole times',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} options={CHANGES} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a run, or a function that resolves one. The panel writes the two ends, and a run the rules refuse is off.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-presets',
      label: 'Shortcuts',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes a whole run on every change, and closes on the press that completes it.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-confirm',
      label: 'With and without a confirmation',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} />;`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A start with no end is a value a filter may hold, and the dash says so.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-open-end',
      label: 'An open end',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultPosition="end" defaultValue={OPEN} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-sizes',
      label: 'Size',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} size="sm" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-variants',
      label: 'Variant',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} variant="outline" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the frame’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-states',
      label: 'States',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} disabled />;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'startName and endName post the two times, a reset returns to the first run, and a Field names the frame and not the panel.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-forms',
      label: 'In a form',
      language: 'tsx',
      source: `<Field>
  <FieldLabel>Booking</FieldLabel>
  <TimeRangePicker endName="to" startName="from" />
</Field>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the two ends are buttons and the panel shows the clock of one of them. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-narrow',
      label: 'One column',
      language: 'tsx',
      source: `<TimeRangePicker {...BASE} defaultValue={BOOKING} presets={PRESETS} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, the open state and the end being edited, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-composition',
      label: 'Composition and escape hatches',
      language: 'tsx',
      source: `<TimeRangePicker footer="The room closes at 6" onValueChange={setRun} value={run} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The fields, the clocks and the handles keep their keys.',
    snippet: defineSnippet({
      id: 'time-range-picker-react-keyboard',
      label: 'The keyboard',
      language: 'tsx',
      source: `// Enter, Space, ArrowDown  opens on the clock of the current end
// Arrows, Home, End        move in a grid of a clock
// Enter / Space            chooses the hour or the minute
// Arrows on a handle       move the end one step
// PageUp / PageDown        on a handle, move it one hour
// Ctrl + Enter             applies
// Escape                   discards and closes`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'TimeRange | null',
    '—',
    'TimeRangePicker',
    'The run held, either end of which may be null. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'TimeRange | null',
    'null',
    'TimeRangePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'TimeRangePicker',
    'The end being edited. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'TimeRangePicker', 'The end it starts on.'],
  ['minLength', 'number', '—', 'TimeRangePicker', 'The shortest run, in seconds.'],
  ['maxLength', 'number', '—', 'TimeRangePicker', 'The longest run, in seconds.'],
  [
    'contiguous',
    'boolean',
    'true',
    'TimeRangePicker',
    'Whether a run may cross an unavailable time.',
  ],
  ['min', 'PlainTime', '—', 'TimeRangePicker', 'The earliest accepted time.'],
  ['max', 'PlainTime', '—', 'TimeRangePicker', 'The latest accepted time.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'TimeRangePicker',
    'Refuses particular times.',
  ],
  [
    'lengthLabel',
    '(seconds: number, locale: string | undefined) => string',
    'the locale’s',
    'TimeRangePicker',
    'Writes a length in words.',
  ],
  [
    'step',
    'number',
    '900',
    'TimeRangePicker',
    'Seconds between two offered times, counted from min or from midnight.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'TimeRangePicker',
    'The times there are, stated rather than stepped, for both ends.',
  ],
  [
    'presets',
    'readonly PickerPreset<TimeRange>[]',
    '—',
    'TimeRangePicker',
    'The consumer’s own shortcuts.',
  ],
  [
    'durations',
    'readonly number[]',
    '900 to 14400',
    'TimeRangePicker',
    'Lengths the run takes from its start, in seconds. An empty list draws none.',
  ],
  ['confirm', 'boolean', 'true', 'TimeRangePicker', 'Whether the panel keeps a draft until Apply.'],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'TimeRangePicker',
    'The finest unit written.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'TimeRangePicker',
    'The clock the times are written on.',
  ],
  [
    'referenceTime',
    'PlainTime',
    'now',
    'TimeRangePicker',
    'The time it is, whose hour the clocks outline.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'TimeRangePicker',
    'Whether + and - open the duration expression in the fields.',
  ],
  ['startName', 'string', '—', 'TimeRangePicker', 'The name a form posts the start under.'],
  ['endName', 'string', '—', 'TimeRangePicker', 'The name a form posts the end under.'],
  [
    'invalid',
    'boolean',
    '—',
    'TimeRangePicker',
    'Stated by the consumer; a run that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'TimeRangePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'TimeRangePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'TimeRangePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'TimeRangePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TimeRangePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'TimeRangePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'TimeRangePicker', 'Which zone answers "what is now".'],
  ['disabled', 'boolean', '—', 'TimeRangePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'TimeRangePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'TimeRangePicker', 'The form needs a value.'],
  [
    'clearable',
    'boolean',
    'false',
    'TimeRangePicker',
    'Draws a clear on the control and in the panel, unless required.',
  ],
  [
    'messages',
    'Partial<TimeRangePickerMessages>',
    '—',
    'TimeRangePicker',
    'Words laid over the language in force: the trigger’s names, the two ends, the limits, and what is said of a refused run.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: TimeRange | null, request: ChangeRequest<TimeRange | null>)',
    when: 'Before the value moves, and cancellable: from Apply, and from the clear of the frame.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel opens or closes, with the reason.',
  },
  {
    name: 'onPositionChange',
    payload: '(position: TimeRangePickerPosition, request: ChangeRequest<TimeRangePickerPosition>)',
    when: 'Before the end being edited moves.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TimeRangePickerDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets confirm, granularity, hourCycle, lengthLabel, placement, size, step, timeZone and variant once.',
  ],
  [
    'footer',
    'ReactNode',
    'the limits, or the step',
    'TimeRangePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'renderSlot',
    '(state: ClockSlotState) => ReactNode',
    'the time',
    'TimeRangePicker',
    'What one whole time of options draws.',
  ],
  [
    'render',
    '(props: TimeRangePickerRootProps) => ReactNode',
    '—',
    'TimeRangePicker',
    'Substitutes the element the root renders.',
  ],
  ['ref', 'Ref<TimeRangePickerHandle>', '—', 'TimeRangePicker', 'focus(), open() and close().'],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and leaves focus in the field, so the segments keep every key they had.',
  'The length between the two halves is a status region, so a reader hears it on every step.',
  'Each handle of the day is a slider with its time in aria-valuetext, and every value a drag reaches is also two presses or a typed time away.',
];

export const REACT_TIME_RANGE_PICKER_DOCS = {
  timeRangePicker: {
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
