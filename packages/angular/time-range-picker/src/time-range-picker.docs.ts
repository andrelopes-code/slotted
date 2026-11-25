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

export const ANGULAR_TIME_RANGE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Time Range Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { SlTimeRangePicker } from '@slotted/angular/time-range-picker';",
  selector: '[slTimeRangePicker]',
  exportAs: 'slTimeRangePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
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
      id: 'time-range-picker-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking"></div>`,
    }),
  },
  {
    id: 'panel',
    title: 'The day and two clocks',
    note: 'The clock of the end refuses what the start refuses of it, in the gesture that chooses the start.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-panel',
      label: 'The day and two clocks',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" defaultOpen></div>`,
    }),
  },
  {
    id: 'length',
    title: 'The length',
    note: 'One step of the clock either way, between the two ends. lengthLabel writes it in the product’s own words.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-length',
      label: 'The length',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking"></div>`,
    }),
  },
  {
    id: 'durations',
    title: 'Durations',
    note: 'Lengths the run takes from its start. One past midnight, or refused, is off, and an empty list draws none.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-durations',
      label: 'Durations',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" [durations]="[1800, 3600, 14400]"></div>`,
    }),
  },
  {
    id: 'limits',
    title: 'The shortest and the longest run',
    note: 'In seconds, the unit step is written in. A run that is over says by how much, and Apply is off.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-limits',
      label: 'The shortest and the longest run',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" maxLength="14400" minLength="1800"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Times the product refuses',
    note: 'A run may not cross an unavailable time while contiguous holds.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-unavailable',
      label: 'Times the product refuses',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" [isTimeUnavailable]="isNoon"></div>`,
    }),
  },
  {
    id: 'step',
    title: 'Step',
    note: 'Seconds between two offered times, in both clocks, on the day and in the step of the length.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-step',
      label: 'Step',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" step="300"></div>`,
    }),
  },
  {
    id: 'explicit',
    title: 'Whole times',
    note: 'options states the times there are, for both ends, under the part of the day each one is in.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-explicit',
      label: 'Whole times',
      language: 'angular',
      source: `<div slTimeRangePicker [options]="changes"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a run, or a function that resolves one. The panel writes the two ends, and a run the rules refuse is off.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-presets',
      label: 'Shortcuts',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes a whole run on every change, and closes on the press that completes it.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-confirm',
      label: 'With and without a confirmation',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking"></div>`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A start with no end is a value a filter may hold, and the dash says so.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-open-end',
      label: 'An open end',
      language: 'angular',
      source: `<div slTimeRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-sizes',
      label: 'Size',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" size="sm"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-variants',
      label: 'Variant',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" variant="outline"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the frame’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" disabled></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'startName and endName post the two times, a reset returns to the first run, and a Field names the frame and not the panel.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-forms',
      label: 'In a form',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Booking</label>
  <div slTimeRangePicker endName="to" startName="from"></div>
</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the two ends are buttons and the panel shows the clock of one of them. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-narrow',
      label: 'One column',
      language: 'angular',
      source: `<div slTimeRangePicker [defaultValue]="booking" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, the open state and the end being edited, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-composition',
      label: 'Composition and escape hatches',
      language: 'angular',
      source: `<div slTimeRangePicker [value]="run()" (valueChange)="run.set($event.value)">
  <span slTimeRangePickerFooter>The room closes at 6</span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The fields, the clocks and the handles keep their keys.',
    snippet: defineSnippet({
      id: 'time-range-picker-angular-keyboard',
      label: 'The keyboard',
      language: 'angular',
      source: `<!-- Enter, Space, ArrowDown  opens on the clock of the current end -->
<!-- Arrows, Home, End        move in a grid of a clock -->
<!-- Enter / Space            chooses the hour or the minute -->
<!-- Arrows on a handle       move the end one step -->
<!-- PageUp / PageDown        on a handle, move it one hour -->
<!-- Ctrl + Enter             applies -->
<!-- Escape                   discards and closes -->
<div slTimeRangePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'TimeRange | null',
    '—',
    'SlTimeRangePicker',
    'The run held, either end of which may be null. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'TimeRange | null',
    'null',
    'SlTimeRangePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'SlTimeRangePicker',
    'The end being edited. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'SlTimeRangePicker', 'The end it starts on.'],
  ['minLength', 'number', '—', 'SlTimeRangePicker', 'The shortest run, in seconds.'],
  ['maxLength', 'number', '—', 'SlTimeRangePicker', 'The longest run, in seconds.'],
  [
    'contiguous',
    'boolean',
    'true',
    'SlTimeRangePicker',
    'Whether a run may cross an unavailable time.',
  ],
  ['min', 'PlainTime', '—', 'SlTimeRangePicker', 'The earliest accepted time.'],
  ['max', 'PlainTime', '—', 'SlTimeRangePicker', 'The latest accepted time.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'SlTimeRangePicker',
    'Refuses particular times.',
  ],
  [
    'lengthLabel',
    '(seconds: number, locale: string | undefined) => string',
    'the locale’s',
    'SlTimeRangePicker',
    'Writes a length in words.',
  ],
  [
    'step',
    'number',
    '900',
    'SlTimeRangePicker',
    'Seconds between two offered times, counted from min or from midnight.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlTimeRangePicker',
    'The times there are, stated rather than stepped, for both ends.',
  ],
  [
    'presets',
    'readonly PickerPreset<TimeRange>[]',
    '—',
    'SlTimeRangePicker',
    'The consumer’s own shortcuts.',
  ],
  [
    'durations',
    'readonly number[]',
    '900 to 14400',
    'SlTimeRangePicker',
    'Lengths the run takes from its start, in seconds. An empty list draws none.',
  ],
  [
    'confirm',
    'boolean',
    'true',
    'SlTimeRangePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'granularity',
    "'hour' | 'minute' | 'second'",
    'minute',
    'SlTimeRangePicker',
    'The finest unit written.',
  ],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'SlTimeRangePicker',
    'The clock the times are written on.',
  ],
  [
    'referenceTime',
    'PlainTime',
    'now',
    'SlTimeRangePicker',
    'The time it is, whose hour the clocks outline.',
  ],
  [
    'relative',
    'boolean',
    'true',
    'SlTimeRangePicker',
    'Whether + and - open the duration expression in the fields.',
  ],
  ['startName', 'string', '—', 'SlTimeRangePicker', 'The name a form posts the start under.'],
  ['endName', 'string', '—', 'SlTimeRangePicker', 'The name a form posts the end under.'],
  [
    'invalid',
    'boolean',
    '—',
    'SlTimeRangePicker',
    'Stated by the consumer; a run that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlTimeRangePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlTimeRangePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlTimeRangePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlTimeRangePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlTimeRangePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlTimeRangePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'SlTimeRangePicker', 'Which zone answers "what is now".'],
  ['disabled', 'boolean', '—', 'SlTimeRangePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'SlTimeRangePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'SlTimeRangePicker', 'The form needs a value.'],
  ['clearable', 'boolean', 'false', 'SlTimeRangePicker', 'Draws a clear on the control.'],
  [
    'messages',
    'Partial<TimeRangePickerMessages>',
    '—',
    'SlTimeRangePicker',
    'Words laid over the language in force: the trigger’s names, the two ends, the limits, and what is said of a refused run.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<TimeRange | null>',
    when: 'Before the value moves, and cancellable: from Apply, and from the clear of the frame.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes, with the reason.',
  },
  {
    name: 'positionChange',
    payload: 'ChangeRequest<TimeRangePickerPosition>',
    when: 'Before the end being edited moves.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideTimeRangePickerDefaults',
    'function',
    '—',
    'application',
    'Sets confirm, granularity, hourCycle, lengthLabel, placement, size, step, timeZone and variant once.',
  ],
  [
    'slTimeRangePickerFooter',
    'directive',
    'the limits, or the step',
    'SlTimeRangePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'slClockSlot',
    'template',
    'the time',
    'SlTimeRangePicker',
    'What one whole time of options draws.',
  ],
  [
    'formControl, ngModel',
    'forms',
    '—',
    'SlTimeRangePicker',
    'The picker is a ControlValueAccessor and a Validator.',
  ],
  [
    'focus(), openSurface(), closeSurface()',
    'methods',
    '—',
    'SlTimeRangePicker',
    'Reached through exportAs.',
  ],
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

export const ANGULAR_TIME_RANGE_PICKER_DOCS = {
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
