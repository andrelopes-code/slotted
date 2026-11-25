import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import clockTokens from '@slotted/styles/clock/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CLOCK_TOKENS = clockTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Clock decision',
}));

const imports: ReferenceImport = {
  source: "import { SlClock } from '@slotted/angular/clock';",
  selector: '[slClock]',
  exportAs: 'slClock',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The box the grids stand in, with role="group". Carries data-ui="clock", data-granularity, data-slots, data-disabled and data-readonly. aria-label names the whole clock.',
  },
  {
    part: 'hours',
    element: 'div',
    required: true,
    purpose:
      'The listbox of the twenty-four hours, six to a row. Each row is a group named by the part of the day, or by AM and PM under a 12-hour cycle.',
  },
  {
    part: 'period',
    element: 'span',
    required: true,
    purpose:
      'The name of a row, drawn on the label column and hidden from assistive technology, which is told the same name by the group.',
  },
  {
    part: 'hour',
    element: 'button',
    required: true,
    purpose:
      'One hour. It carries aria-selected, aria-disabled when no accepted time is in it, and data-now when it is the hour it is. Under a 12-hour cycle its accessible name is the whole hour, "02 PM".',
  },
  {
    part: 'minutes',
    element: 'div',
    required: false,
    purpose:
      'The row of the minutes: its name and its cells. data-columns is 4, 6 or 10, by how many minutes the step leaves in an hour.',
  },
  {
    part: 'seconds',
    element: 'div',
    required: false,
    purpose: 'The same row for the seconds, drawn at the second granularity.',
  },
  {
    part: 'cells',
    element: 'div',
    required: false,
    purpose:
      'The listbox of the minutes or of the seconds, and the box a part of the day keeps its whole times in.',
  },
  { part: 'minute', element: 'button', required: false, purpose: 'One minute of the hour held.' },
  { part: 'second', element: 'button', required: false, purpose: 'One second of the minute held.' },
  {
    part: 'slots',
    element: 'div',
    required: false,
    purpose:
      'The listbox of whole times, when options states them, grouped by the part of the day.',
  },
  {
    part: 'slot',
    element: 'button',
    required: false,
    purpose: 'One whole time. What it draws can be the consumer’s.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'What a stated list with nothing in it says.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Two presses write a time: an hour, then a minute. The controls of the story answer the axes a product sets.',
    snippet: defineSnippet({
      id: 'clock-angular-playground',
      label: 'Basic',
      language: 'angular',
      source: `<div slClock aria-label="Departure time" [defaultValue]="halfPastTwo"></div>`,
    }),
  },
  {
    id: 'steps',
    title: 'The step decides the minutes',
    note: 'Four across for a quarter of an hour, six for five minutes, ten for one minute. Nothing scrolls at any of the three.',
    snippet: defineSnippet({
      id: 'clock-angular-steps',
      label: 'Five minutes',
      language: 'angular',
      source: `<div slClock aria-label="Departure time" step="300"></div>`,
    }),
  },
  {
    id: 'hour-cycle',
    title: 'Twelve and twenty-four hours',
    note: 'The locale decides the cycle and hourCycle overrides it. A 24-hour clock names the parts of the day, and a 12-hour one names the halves.',
    snippet: defineSnippet({
      id: 'clock-angular-hour-cycle',
      label: 'Twelve hours',
      language: 'angular',
      source: `<div slClock aria-label="Departure time" [hourCycle]="12"></div>`,
    }),
  },
  {
    id: 'seconds',
    title: 'Hours alone, and seconds',
    note: 'granularity is the finest unit drawn. The minutes leave at the hour, and the seconds join at the second.',
    snippet: defineSnippet({
      id: 'clock-angular-seconds',
      label: 'Seconds',
      language: 'angular',
      source: `<div slClock aria-label="Cue" granularity="second" step="5"></div>`,
    }),
  },
  {
    id: 'slots',
    title: 'A stated list of times',
    note: 'A clinic open at 08:40, 09:20 and 13:45 has no step. The times are drawn whole, under the part of the day each one is in, and one press chooses.',
    snippet: defineSnippet({
      id: 'clock-angular-slots',
      label: 'Appointments',
      language: 'angular',
      source: `<div slClock aria-label="Appointment" [options]="times">
  <ng-template slClockSlot let-state="state">
    {{ state.label }}
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'bounds',
    title: 'Bounds and refused times',
    note: 'An hour is refused when every time in it is, and keeps its focus. An hour with one accepted time is not refused, and the press takes that time.',
    snippet: defineSnippet({
      id: 'clock-angular-bounds',
      label: 'Opening hours',
      language: 'angular',
      source: `<div slClock aria-label="Visit" [isTimeUnavailable]="isLunch" [max]="closing" [min]="opening"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Disabled, read only and the hour it is',
    note: 'A read-only clock keeps its ink and answers no press. now outlines the hour it is, apart from the chosen one.',
    snippet: defineSnippet({
      id: 'clock-angular-states',
      label: 'States',
      language: 'angular',
      source: `<div slClock aria-label="Now" [now]="tenTwenty"></div>
<div slClock aria-label="Read only" readOnly></div>
<div slClock aria-label="Disabled" disabled></div>`,
    }),
  },
  {
    id: 'density',
    title: 'Density',
    note: 'A row stands one step under the control height and never under the smallest target. Switch the toolbar to dense: the six columns stay and the rows close up.',
    snippet: defineSnippet({
      id: 'clock-angular-density',
      label: 'Dense',
      language: 'angular',
      source: `<div slClock aria-label="Departure time"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The consumer may own the value, a request can be cancelled, and it says which unit the press was in.',
    snippet: defineSnippet({
      id: 'clock-angular-composition',
      label: 'Controlled',
      language: 'angular',
      source: `<div slClock aria-label="Departure time" [value]="time()" (valueChange)="onTime($event)"></div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'One tab stop for the hours and one for the minutes. The arrows move on both axes and choose nothing.',
    snippet: defineSnippet({
      id: 'clock-angular-keyboard',
      label: 'The keys',
      language: 'angular',
      source: `<!-- ArrowLeft / ArrowRight  one time, mirrored under dir="rtl" -->
<!-- ArrowUp / ArrowDown     the same column, a row either way -->
<!-- Home / End              the first and last time of the row -->
<!-- PageUp / PageDown       the first and last row -->
<!-- Enter / Space           chooses the time focus is on -->
<div slClock></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainTime | null',
    '—',
    'SlClock',
    'The time held. Present means the consumer owns it; null is an owned empty value.',
  ],
  [
    'defaultValue',
    'PlainTime | null',
    'null',
    'SlClock',
    'What it starts from when nobody else writes one. Read once.',
  ],
  [
    'step',
    'number',
    '900',
    'SlClock',
    'Seconds between two offered times, counted from min or from midnight.',
  ],
  [
    'options',
    'readonly PlainTime[]',
    '—',
    'SlClock',
    'The times to offer, stated rather than stepped. The clock then draws whole times.',
  ],
  ['granularity', "'hour' | 'minute' | 'second'", 'minute', 'SlClock', 'The finest unit drawn.'],
  [
    'hourCycle',
    '12 | 24',
    'the locale’s',
    'SlClock',
    'Twelve hours in two halves, or twenty-four in four parts of the day.',
  ],
  [
    'min',
    'PlainTime',
    '—',
    'SlClock',
    'The earliest accepted time, and the base the step counts from.',
  ],
  ['max', 'PlainTime', '—', 'SlClock', 'The latest accepted time.'],
  [
    'isTimeUnavailable',
    '(time: PlainTime) => boolean',
    '—',
    'SlClock',
    'Refuses particular times. An hour is refused when every time in it is.',
  ],
  ['now', 'PlainTime', '—', 'SlClock', 'The time it is, whose hour is outlined.'],
  [
    'locale',
    'string',
    'the language in force',
    'SlClock',
    'BCP 47. Decides the digits, the cycle and the names of the halves.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'SlClock',
    'Answers no key and no press, and takes every time out of the tab sequence.',
  ],
  ['readOnly', 'boolean', 'false', 'SlClock', 'Readable and not changeable, and never faded.'],
  [
    'messages',
    'Partial<ClockMessages>',
    '—',
    'SlClock',
    'Words laid over the language in force, key by key: the names of the grids and of the parts of the day.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ClockChangeRequest',
    when: 'Before the value moves, and cancellable. The request carries the new time, the one it replaces, the reason — pointer or keyboard — the originating event, and the unit the press was in: hour, minute, second or slot.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'slClockSlot',
    'ng-template',
    '—',
    'SlClock',
    'What one whole time draws, with the time and its state. The button around it stays the family’s.',
  ],
  [
    'focus()',
    '() => void',
    '—',
    'SlClock',
    'Puts the reader on the chosen hour, or on the one the clock opens at. Reached through exportAs.',
  ],
]);

const accessibility: string[] = [
  'Each grid is a listbox with one tab stop, so a clock is two stops rather than twenty-eight.',
  'The arrows move focus and choose nothing. A listbox whose selection followed focus would write a time at every step of a walk.',
  'A part of the day is a group with its own name, so a screen reader hears "Afternoon" once and not before each of its six hours.',
  'Under a 12-hour cycle an hour is named whole, "02 PM", because the figure alone names two hours.',
  'A refused hour carries aria-disabled rather than being removed, and it is struck through as well as dimmed, because color alone says nothing under forced colors.',
  'The hour it is is an outline and the chosen hour a fill, so the two facts are told apart without color.',
];

export const ANGULAR_CLOCK_DOCS = {
  clock: { accessibility, anatomy, api, composition, events, imports, scenes, snippets: [] },
};
