import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tokens from '@slotted/styles/datetime-range-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DATETIME_RANGE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Datetime Range Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { SlDateTimeRangePicker } from '@slotted/angular/datetime-range-picker';",
  selector: '[slDateTimeRangePicker]',
  exportAs: 'slDateTimeRangePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The frame of the picker. Carries data-ui="datetime-range-picker", data-calendar, data-granularity, data-size, data-variant, data-open and the state attributes.',
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
    note: 'A day, its time, the other day, its time: each press brings the grid of the half that is missing, and Apply writes the run.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
    }),
  },
  {
    id: 'panel',
    title: 'Two months and two clocks',
    note: 'The run is drawn over its months, both ends are typed or pressed, and each clock answers the day of its own end.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-panel',
      label: 'Two months and two clocks',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" defaultOpen></div>`,
    }),
  },
  {
    id: 'length',
    title: 'The length',
    note: 'One day of the end either way, between the two ends. lengthLabel writes it in the product’s own words.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-length',
      label: 'The length',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
    }),
  },
  {
    id: 'durations',
    title: 'Durations',
    note: 'Lengths the run takes from its start. One a rule refuses is off, and an empty list draws none.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-durations',
      label: 'Durations',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" [durations]="[43200, 86400, 604800]"></div>`,
    }),
  },
  {
    id: 'limits',
    title: 'The shortest and the longest run',
    note: 'In seconds, the unit step is written in. A run that is over says by how much, marks its days, and turns Apply off.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-limits',
      label: 'The shortest and the longest run',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" maxLength="604800" minLength="86400"></div>`,
    }),
  },
  {
    id: 'day-window',
    title: 'The hours of every day',
    note: 'min and max bound the whole run, and minTime and maxTime bound every day inside it. Each clock runs on the day of its own end.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-day-window',
      label: 'The hours of every day',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" [maxTime]="eightPm" [minTime]="eight"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days the product refuses',
    note: 'A run may not cross an unavailable day while contiguous holds, and the grid refuses the days beyond it.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-unavailable',
      label: 'Days the product refuses',
      language: 'angular',
      source: `<div slDateTimeRangePicker [isDateUnavailable]="isTaken"></div>`,
    }),
  },
  {
    id: 'explicit',
    title: 'Whole times',
    note: 'options states the times there are, for both ends, under the part of the day each one is in.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-explicit',
      label: 'Whole times',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" [options]="desk"></div>`,
    }),
  },
  {
    id: 'months',
    title: 'Months',
    note: 'Two by default, over two clocks of the same width. One in one column, and one where a run stays inside a month.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-months',
      label: 'Months',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" months="1"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a run, or a function that resolves one. The panel writes the two days, and a run the rules refuse is off.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-presets',
      label: 'Shortcuts',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes a whole run on every change, and closes on the press that completes it.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-confirm',
      label: 'With and without a confirmation',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A start with no end is a value a filter may hold, and the dash says so.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-open-end',
      label: 'An open end',
      language: 'angular',
      source: `<div slDateTimeRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-sizes',
      label: 'Size',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" size="sm"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-variants',
      label: 'Variant',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" variant="outline"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the frame’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" disabled></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'startName and endName post the two moments, a reset returns to the first run, and a Field names the frame and not the panel.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-forms',
      label: 'In a form',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Rental</label>
  <div slDateTimeRangePicker endName="to" startName="from"></div>
</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the two ends are written as a day and a time, and each is a press that brings its grid. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-narrow',
      label: 'One column',
      language: 'angular',
      source: `<div slDateTimeRangePicker [defaultValue]="rental" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, the open state and the end being edited, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-composition',
      label: 'Composition and escape hatches',
      language: 'angular',
      source: `<div slDateTimeRangePicker [value]="run()" (valueChange)="run.set($event.value)">
  <span slDateTimeRangePickerFooter>Keys at the desk</span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The fields, the months and the clocks keep their keys.',
    snippet: defineSnippet({
      id: 'datetime-range-picker-angular-keyboard',
      label: 'The keyboard',
      language: 'angular',
      source: `<!-- Enter, Space, ArrowDown  opens on the day of the current end -->
<!-- Arrows, Home, End        move in the months, and in a grid of a clock -->
<!-- PageUp / PageDown        turn the month, and with Shift the year -->
<!-- Enter / Space            chooses, and brings the half that is missing -->
<!-- Ctrl + Enter             applies -->
<!-- Escape                   walks down a view, then discards and closes -->
<div slDateTimeRangePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'DateTimeRange | null',
    '—',
    'SlDateTimeRangePicker',
    'The run held, either end of which may be null. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'DateTimeRange | null',
    'null',
    'SlDateTimeRangePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'SlDateTimeRangePicker',
    'The end being edited. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'SlDateTimeRangePicker', 'The end it starts on.'],
  ['minLength', 'number', '—', 'SlDateTimeRangePicker', 'The shortest run, in seconds.'],
  ['maxLength', 'number', '—', 'SlDateTimeRangePicker', 'The longest run, in seconds.'],
  [
    'contiguous',
    'boolean',
    'true',
    'SlDateTimeRangePicker',
    'Whether a run may cross an unavailable day.',
  ],
  ['min', 'PlainDateTime', '—', 'SlDateTimeRangePicker', 'The earliest accepted moment.'],
  ['max', 'PlainDateTime', '—', 'SlDateTimeRangePicker', 'The latest accepted moment.'],
  [
    'minTime',
    'PlainTime',
    '—',
    'SlDateTimeRangePicker',
    'The earliest time of every day inside the range.',
  ],
  [
    'maxTime',
    'PlainTime',
    '—',
    'SlDateTimeRangePicker',
    'The latest time of every day inside the range.',
  ],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateTimeRangePicker',
    'Refuses particular dates.',
  ],
  [
    'isTimeUnavailable',
    '(time: PlainTime, date: PlainDate) => boolean',
    '—',
    'SlDateTimeRangePicker',
    'Refuses particular times of a day.',
  ],
  [
    'lengthLabel',
    '(seconds: number, locale: string | undefined) => string',
    'the locale’s',
    'SlDateTimeRangePicker',
    'Writes a length in words.',
  ],
  [
    'step',
    'number',
    '900',
    'SlDateTimeRangePicker',
    'Seconds between two offered times, counted from the first of the day.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlDateTimeRangePicker',
    'The times there are, stated rather than stepped, for both ends.',
  ],
  [
    'presets',
    'readonly PickerPreset<DateTimeRange>[]',
    '—',
    'SlDateTimeRangePicker',
    'The consumer’s own shortcuts.',
  ],
  [
    'durations',
    'readonly number[]',
    '1 to 14 days',
    'SlDateTimeRangePicker',
    'Lengths the run takes from its start, in seconds. An empty list draws none.',
  ],
  [
    'confirm',
    'boolean',
    'true',
    'SlDateTimeRangePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'months',
    'number',
    '2',
    'SlDateTimeRangePicker',
    'How many months the panel shows. One below 760 pixels.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlDateTimeRangePicker',
    'Draws the ISO week number, as a press that chooses the week.',
  ],
  ['fixedWeeks', 'boolean', 'false', 'SlDateTimeRangePicker', 'Six rows whatever the months need.'],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlDateTimeRangePicker',
    'The finest unit written.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'SlDateTimeRangePicker',
    'The clock the moments are written on.',
  ],
  [
    'referenceDateTime',
    'PlainDateTime',
    'now',
    'SlDateTimeRangePicker',
    'The moment it is, which the distances are counted from.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlDateTimeRangePicker',
    'Whether + and - open the duration expression in the fields.',
  ],
  ['firstDayOfWeek', 'number', 'the locale’s', 'SlDateTimeRangePicker', '0 is Sunday.'],
  ['yearPivot', 'number', '—', 'SlDateTimeRangePicker', 'How a two-digit typed year resolves.'],
  ['calendar', "'gregory'", 'gregory', 'SlDateTimeRangePicker', 'The calendar system.'],
  ['startName', 'string', '—', 'SlDateTimeRangePicker', 'The name a form posts the start under.'],
  ['endName', 'string', '—', 'SlDateTimeRangePicker', 'The name a form posts the end under.'],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Stated by the consumer; a run that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDateTimeRangePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDateTimeRangePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDateTimeRangePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateTimeRangePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateTimeRangePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDateTimeRangePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  [
    'timeZone',
    'string',
    'the runtime’s',
    'SlDateTimeRangePicker',
    'Which zone answers "what is now".',
  ],
  ['disabled', 'boolean', '—', 'SlDateTimeRangePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'SlDateTimeRangePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'SlDateTimeRangePicker', 'The form needs a value.'],
  ['clearable', 'boolean', 'false', 'SlDateTimeRangePicker', 'Draws a clear on the control.'],
  [
    'messages',
    'Partial<DatetimeRangePickerMessages>',
    '—',
    'SlDateTimeRangePicker',
    'Words laid over the language in force: the trigger’s names, the two ends, the limits, and what is said of a refused run.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<DateTimeRange | null>',
    when: 'Before the value moves, and cancellable: from Apply, and from the clear of the frame.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes, with the reason.',
  },
  {
    name: 'positionChange',
    payload: 'ChangeRequest<DateTimeRangePickerPosition>',
    when: 'Before the end being edited moves.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateTimeRangePickerDefaults',
    'function',
    '—',
    'application',
    'Sets calendar, confirm, firstDayOfWeek, granularity, hourCycle, lengthLabel, months, placement, size, step, timeZone and variant once.',
  ],
  [
    'slDateTimeRangePickerFooter',
    'directive',
    'the limits, the zone or the step',
    'SlDateTimeRangePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'slClockSlot',
    'template',
    'the time',
    'SlDateTimeRangePicker',
    'What one whole time of options draws.',
  ],
  [
    'formControl, ngModel',
    'forms',
    '—',
    'SlDateTimeRangePicker',
    'The picker is a ControlValueAccessor and a Validator.',
  ],
  [
    'focus(), openSurface(), closeSurface()',
    'methods',
    '—',
    'SlDateTimeRangePicker',
    'Reached through exportAs.',
  ],
]);

const accessibility: string[] = [
  'The trigger says aria-haspopup="dialog" and its name carries the value written, which is where focus returns when the panel closes.',
  'The panel is a dialog with its Tab wrapped, and each grid inside it is one stop.',
  'Escape discards the draft and returns focus to the trigger. Ctrl+Enter applies from anywhere in the panel.',
  'The footer’s hint is a status region, so the reason Apply is off is spoken as well as drawn.',
  'Alt+ArrowDown opens the panel and leaves focus in the field, so the segments keep every key they had.',
  'The length between the two halves is a status region, so a reader hears it on every arrow in the months and on every step.',
  'The press that leaves a half missing carries focus to its grid, so the four halves are one path and not four searches.',
];

export const ANGULAR_DATETIME_RANGE_PICKER_DOCS = {
  dateTimeRangePicker: {
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
