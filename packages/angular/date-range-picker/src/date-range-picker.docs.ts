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

export const ANGULAR_DATE_RANGE_PICKER_TOKENS = tokens.map((name) => ({
  name,
  purpose: 'Theme-owned Date Range Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { SlDateRangePicker } from '@slotted/angular/date-range-picker';",
  selector: '[slDateRangePicker]',
  exportAs: 'slDateRangePicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
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
      id: 'date-range-picker-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay"></div>`,
    }),
  },
  {
    id: 'length',
    title: 'What the length counts',
    note: 'A stay counts nights and a leave counts days: the same two dates are four or five. The steps of the head move the end one day.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-length',
      label: 'What the length counts',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" count="nights"></div>`,
    }),
  },
  {
    id: 'limits',
    title: 'The shortest and the longest run',
    note: 'While a start is chosen, the grid refuses the days outside the limits. A run that is over says by how much, marks its days, and turns Apply off.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-limits',
      label: 'The shortest and the longest run',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" count="nights" maxLength="7" minLength="2"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'Shortcuts',
    note: 'A label and a run, or a function that resolves one. The panel writes the two ends, and a run the rules refuse is off.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-presets',
      label: 'Shortcuts',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" count="nights" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'confirm',
    title: 'With and without a confirmation',
    note: 'The panel keeps a draft until Apply. confirm={false} writes the run on the press that closes it.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-confirm',
      label: 'With and without a confirmation',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay"></div>`,
    }),
  },
  {
    id: 'weeks',
    title: 'Whole weeks',
    note: 'With weekNumbers, a press on the number chooses the week.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-weeks',
      label: 'Whole weeks',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" weekNumbers></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days the product refuses',
    note: 'A run may not cross an unavailable day while contiguous holds, and the grid refuses the days beyond it.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-unavailable',
      label: 'Days the product refuses',
      language: 'angular',
      source: `<div slDateRangePicker [isDateUnavailable]="isTaken"></div>`,
    }),
  },
  {
    id: 'open-end',
    title: 'An open end',
    note: 'A start with no end is a value a filter may hold. Opened on its end, the next press closes it.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-open-end',
      label: 'An open end',
      language: 'angular',
      source: `<div slDateRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Size',
    note: 'The three heights every control has. The panel keeps its own measures at each of them.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-sizes',
      label: 'Size',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" size="sm"></div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variant',
    note: 'The three frames every field has, so a picker stands beside a field of its own variant.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-variants',
      label: 'Variant',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" variant="outline"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Each is the frame’s own, and the trigger answers it.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" disabled></div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'startName and endName post the two days, a reset returns to the first run, and a Field names the frame and not the panel.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-forms',
      label: 'In a form',
      language: 'angular',
      source: `<div slField>
  <label slFieldLabel>Leave</label>
  <div slDateRangePicker endName="to" startName="from"></div>
</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'One column',
    note: 'Under 760 pixels the panel shows one month and the shortcuts become a strip over the footer. On a finger it is a sheet.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-narrow',
      label: 'One column',
      language: 'angular',
      source: `<div slDateRangePicker [defaultValue]="stay" [presets]="presets"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, the open state and the end being edited, and a provider states the shape once.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-composition',
      label: 'Composition and escape hatches',
      language: 'angular',
      source: `<div slDateRangePicker [value]="run()" (valueChange)="run.set($event.value)">
  <span slDateRangePickerFooter>Returns by noon</span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'The fields keep their keys, and the panel adds the calendar’s.',
    snippet: defineSnippet({
      id: 'date-range-picker-angular-keyboard',
      label: 'The keyboard',
      language: 'angular',
      source: `<!-- Alt + ArrowDown         opens, with focus in the field -->
<!-- ArrowDown / ArrowUp     on the trigger, opens on the current end -->
<!-- Arrows, Home, End       move in the months -->
<!-- PageUp / PageDown       turn the month, and with Shift the year -->
<!-- Enter / Space           opens the run, then closes it -->
<!-- Ctrl + Enter            applies -->
<!-- Escape                  walks down a view, then discards and closes -->
<div slDateRangePicker></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'DateRange | null',
    '—',
    'SlDateRangePicker',
    'The run held, either end of which may be null. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'DateRange | null',
    'null',
    'SlDateRangePicker',
    'What it starts from, and returns to on a form reset. Read once.',
  ],
  [
    'position',
    "'start' | 'end'",
    '—',
    'SlDateRangePicker',
    'The end the next press writes. Present means the consumer owns it.',
  ],
  ['defaultPosition', "'start' | 'end'", 'start', 'SlDateRangePicker', 'The end it starts on.'],
  ['count', "'days' | 'nights'", 'days', 'SlDateRangePicker', 'What the length counts.'],
  ['minLength', 'number', '—', 'SlDateRangePicker', 'The shortest run, in the unit count names.'],
  ['maxLength', 'number', '—', 'SlDateRangePicker', 'The longest run, in the unit count names.'],
  [
    'contiguous',
    'boolean',
    'true',
    'SlDateRangePicker',
    'Whether a run may cross an unavailable day.',
  ],
  ['min', 'PlainDate', '—', 'SlDateRangePicker', 'The earliest accepted date.'],
  ['max', 'PlainDate', '—', 'SlDateRangePicker', 'The latest accepted date.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlDateRangePicker',
    'Refuses particular dates.',
  ],
  [
    'presets',
    'readonly PickerPreset<DateRange>[]',
    '—',
    'SlDateRangePicker',
    'The consumer’s own shortcuts.',
  ],
  [
    'confirm',
    'boolean',
    'true',
    'SlDateRangePicker',
    'Whether the panel keeps a draft until Apply.',
  ],
  [
    'months',
    'number',
    '2',
    'SlDateRangePicker',
    'How many months the panel shows. One below 760 pixels.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlDateRangePicker',
    'Draws the ISO week number, as a press that chooses the week.',
  ],
  ['fixedWeeks', 'boolean', 'false', 'SlDateRangePicker', 'Six rows whatever the months need.'],
  ['firstDayOfWeek', 'number', 'the locale’s', 'SlDateRangePicker', '0 is Sunday.'],
  ['yearPivot', 'number', '—', 'SlDateRangePicker', 'How a two-digit typed year resolves.'],
  ['calendar', "'gregory'", 'gregory', 'SlDateRangePicker', 'The calendar system.'],
  ['startName', 'string', '—', 'SlDateRangePicker', 'The name a form posts the start under.'],
  ['endName', 'string', '—', 'SlDateRangePicker', 'The name a form posts the end under.'],
  [
    'invalid',
    'boolean',
    '—',
    'SlDateRangePicker',
    'Stated by the consumer; a run that fails a rule is invalid without it.',
  ],
  [
    'open',
    'boolean',
    '—',
    'SlDateRangePicker',
    'Whether the panel is showing. Present means the consumer owns it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'SlDateRangePicker',
    'Whether it starts open when nobody else says. Read once.',
  ],
  [
    'placement',
    "'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'",
    'bottom-start',
    'SlDateRangePicker',
    'Where the panel opens, before the positioner has read the room.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlDateRangePicker',
    'The height of the control. The field around it answers when the picker does not.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'SlDateRangePicker',
    'How the control draws its frame.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlDateRangePicker',
    'BCP 47. Writes the field, the panel and the trigger’s name.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'SlDateRangePicker', 'Which zone answers "what is now".'],
  ['disabled', 'boolean', '—', 'SlDateRangePicker', 'Answers no key and no press.'],
  ['readOnly', 'boolean', '—', 'SlDateRangePicker', 'Readable and not changeable.'],
  ['required', 'boolean', '—', 'SlDateRangePicker', 'The form needs a value.'],
  ['clearable', 'boolean', 'false', 'SlDateRangePicker', 'Draws a clear on the control.'],
  [
    'messages',
    'Partial<DateRangePickerMessages>',
    '—',
    'SlDateRangePicker',
    'Words laid over the language in force: the trigger’s names, the two ends, what is said of a refused run, and the phrases that count it.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<DateRange | null>',
    when: 'Before the value moves, and cancellable: from a key in a field, from Apply, from Clear.',
  },
  {
    name: 'openChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel opens or closes, with the reason.',
  },
  {
    name: 'positionChange',
    payload: 'ChangeRequest<DateRangePickerPosition>',
    when: 'Before the end being edited moves.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideDateRangePickerDefaults',
    'function',
    '—',
    'application',
    'Sets calendar, confirm, count, months, placement, size, timeZone and variant once.',
  ],
  [
    'slDateRangePickerFooter',
    'directive',
    'the limits',
    'SlDateRangePicker',
    'What the footer says when nothing is wrong.',
  ],
  [
    'formControl, ngModel',
    'forms',
    '—',
    'SlDateRangePicker',
    'The picker is a ControlValueAccessor and a Validator.',
  ],
  [
    'focus(), openSurface(), closeSurface()',
    'methods',
    '—',
    'SlDateRangePicker',
    'Reached through exportAs.',
  ],
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

export const ANGULAR_DATE_RANGE_PICKER_DOCS = {
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
