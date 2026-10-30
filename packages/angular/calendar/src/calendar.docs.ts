import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import calendarTokens from '@slotted/styles/calendar/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CALENDAR_TOKENS = calendarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Calendar decision',
}));

const imports: ReferenceImport = {
  source: "import { SlCalendar } from '@slotted/angular/calendar';",
  selector: '[slCalendar]',
  exportAs: 'slCalendar',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element',
    required: true,
    purpose:
      'The box everything stands in, and the query container the cell size is measured against. Carries data-ui="calendar", data-view, data-months, data-week-numbers and the state attributes. The consumer writes this element, so its classes, its attributes and its own directives are its own.',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose:
      'The row above the grid: the two page triggers with the heading between them. The heading is between rather than beside, because it is the thing being changed and a label at one end would make the pair read as two unrelated buttons.',
  },
  {
    part: 'previous',
    element: 'button',
    required: true,
    purpose:
      'One page back, in whichever view is showing: a month in the day view, a year in the month view, twelve years in the year view, and it is named for that step. Its chevron is the next trigger’s artwork turned, so both follow the document direction from one token.',
  },
  {
    part: 'next',
    element: 'button',
    required: true,
    purpose: 'One page forward, on the same terms as previous.',
  },
  {
    part: 'heading',
    element: 'button',
    required: true,
    purpose:
      'The month and year, and the way up to the month and year views. It is aria-live="polite" because paging with a key changes nothing that focus lands on, so without it nothing announces the new month. It is also what every grid points aria-labelledby at.',
  },
  {
    part: 'grids',
    element: 'div',
    required: true,
    purpose:
      'Holds one month or several. They wrap rather than scroll: a month that no longer fits beside another goes under it, and nothing is withdrawn.',
  },
  {
    part: 'grid',
    element: 'table',
    required: true,
    purpose:
      'One month, carrying role="grid". The row, columnheader and gridcell roles are implied by tr, th and td and are deliberately not written — the APG’s own note, and the duplication a pattern check refuses.',
  },
  {
    part: 'grid-caption',
    element: 'caption',
    required: true,
    purpose:
      'The month’s own name. Out of the picture while one month is drawn, because the heading already shows it; visible once two or three are, because the heading then names the span and nothing else would say where October starts.',
  },
  {
    part: 'week-headers',
    element: 'tr',
    required: true,
    purpose: 'The weekday row, starting on the day the locale starts its week on.',
  },
  {
    part: 'week-header',
    element: 'th',
    required: true,
    purpose:
      'One weekday, drawn in the locale’s own narrow form and never truncated. abbr carries the full name, which is the difference between hearing "Mo" and hearing "Monday".',
  },
  { part: 'week', element: 'tr', required: true, purpose: 'One week of the month.' },
  {
    part: 'week-number',
    element: 'th',
    required: false,
    purpose:
      'The ISO 8601 week number, as a row header. Narrower than a day and separated by a rule, so it reads as an annotation rather than as an eighth day.',
  },
  {
    part: 'cell',
    element: 'td',
    required: true,
    purpose:
      'The grid cell. It carries the facts about the date — data-outside-month, data-unavailable, data-selected, data-range-start, data-range-end, data-in-range — and the range band is painted on it, behind the day.',
  },
  {
    part: 'day',
    element: 'span',
    required: true,
    purpose:
      'The number the reader presses. It holds the roving tabindex, data-today, aria-selected and aria-disabled. It is the cell’s child rather than the cell itself because the range band runs edge to edge while the day stays a rounded box inside it.',
  },
  {
    part: 'mark',
    element: 'span',
    required: false,
    purpose:
      'What falls on the day, drawn from marks: a dot in the row today’s dot reserves, in the mark’s tone, holding the visually hidden count that the day’s accessible name ends with.',
  },
  {
    part: 'months',
    element: 'div',
    required: false,
    purpose: 'The month view’s own grid, four across, reached from the heading.',
  },
  {
    part: 'years',
    element: 'div',
    required: false,
    purpose:
      'The year view’s own grid, four across and twelve to a page. The page is anchored rather than centred, so the year the reader is on keeps its cell between presses.',
  },
  {
    part: 'period',
    element: 'button',
    required: false,
    purpose: 'One month or one year in those two views.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One calendar with every axis on it, driven by the controls below the canvas. Arrow around it, page with PageUp and PageDown, and press the heading to walk up a view.',
    snippet: defineSnippet({
      id: 'calendar-angular-playground',
      label: 'Usage',
      language: 'angular',
      source: `<div slCalendar locale="pt-BR" (valueChange)="onValue($event)"></div>`,
    }),
  },
  {
    id: 'selection',
    title: 'One date',
    note: 'The default mode. Pressing the chosen date again takes it back, which is the only way to empty the value without a control of its own.',
    snippet: defineSnippet({
      id: 'calendar-angular-selection',
      label: 'Single',
      language: 'angular',
      source: `<div slCalendar selectionMode="single" [value]="value" (valueChange)="onValue($event)"></div>`,
    }),
  },
  {
    id: 'range',
    title: 'A run of days',
    note: 'Two presses make a range, and either end may come first: choosing the 11th and then the 7th means the 7th to the 11th. A third press starts again, because a range that only grew could never be narrowed.',
    snippet: defineSnippet({
      id: 'calendar-angular-range',
      label: 'Range and set',
      language: 'angular',
      source: `<div slCalendar selectionMode="range" [value]="run"></div>
<div slCalendar selectionMode="multiple" [value]="dates"></div>`,
    }),
  },
  {
    id: 'views',
    title: 'Day, month and year',
    note: 'Press the heading to walk up and Escape to walk down. A reader entering a birth date must not press "previous month" four hundred times, which is what these two views exist to prevent.',
    snippet: defineSnippet({
      id: 'calendar-angular-views',
      label: 'Views',
      language: 'angular',
      source: `<div slCalendar defaultView="year" (viewChange)="onView($event)"></div>`,
    }),
  },
  {
    id: 'months',
    title: 'More than one month',
    note: 'Two or three months side by side, each with its own caption because the heading then names the span. Narrow the stage: a month that no longer fits wraps under the first rather than being withdrawn.',
    snippet: defineSnippet({
      id: 'calendar-angular-months',
      label: 'Two months',
      language: 'angular',
      source: `<div slCalendar selectionMode="range" [months]="2"></div>`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the month',
    note: 'The month name, the weekday names and the day a week starts on all come from Intl. A German week starts on Monday and a Brazilian one on Sunday, from the same component and no table.',
    snippet: defineSnippet({
      id: 'calendar-angular-locale',
      label: 'Four locales',
      language: 'angular',
      source: `<div slCalendar locale="pt-BR"></div>
<div slCalendar locale="de-DE"></div>
<div slCalendar locale="ja-JP"></div>
<div slCalendar locale="pt-BR" [firstDayOfWeek]="1"></div>`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max fence what the reader may reach: an arrow that would leave the range stops at the edge, and a date outside it cannot be pressed at all.',
    snippet: defineSnippet({
      id: 'calendar-angular-range-bounds',
      label: 'min and max',
      language: 'angular',
      source: `<div slCalendar [min]="first" [max]="last"></div>`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days that are refused',
    note: 'A refused date stays focusable — aria-disabled, never disabled — so a reader can arrow onto it, be told why it is out, and arrow past. Struck through rather than only faded, because colour alone says nothing under forced colours.',
    snippet: defineSnippet({
      id: 'calendar-angular-unavailable',
      label: 'A predicate',
      language: 'angular',
      source: `<div slCalendar [isDateUnavailable]="isWeekend"></div>`,
    }),
  },
  {
    id: 'week-numbers',
    title: 'Week numbers',
    note: 'ISO 8601 numbering, as a row header separated by a rule. The rule is what keeps the column from reading as an eighth day of the week.',
    snippet: defineSnippet({
      id: 'calendar-angular-week-numbers',
      label: 'Week numbers',
      language: 'angular',
      source: `<div slCalendar weekNumbers fixedWeeks [firstDayOfWeek]="1"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only keeps the value legible and answers nothing; disabled takes every cell out of the tab sequence and paints today in the disabled ink; invalid retargets the focus ring rather than removing it.',
    snippet: defineSnippet({
      id: 'calendar-angular-states',
      label: 'The three states',
      language: 'angular',
      source: `<div slCalendar readOnly></div>
<div slCalendar invalid></div>
<div slCalendar disabled></div>`,
    }),
  },
  {
    id: 'density',
    title: 'Density and width',
    note: 'Seven columns of two-digit numbers make this the densest grid the library draws. Switch the toolbar to dense and narrow the stage: the cell is the room there is divided by the columns there are, bounded by the WCAG minimum below.',
    snippet: defineSnippet({
      id: 'calendar-angular-density',
      label: 'Narrow',
      language: 'angular',
      source: `<div slCalendar fixedWeeks></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'A provider sets the shape once, provideSlotted the language; focusedDate is a value of its own a consumer may own; and the ref hands back focus() and focusDate(), which page the grid to reach a date.',
    snippet: defineSnippet({
      id: 'calendar-angular-composition',
      label: 'exportAs and the handle',
      language: 'angular',
      source: `<div slCalendar #cal="slCalendar" locale="pt-BR" (focusedDateChange)="onFocused($event)"></div>
<button type="button" (click)="cal.focusDate(christmas)">Ir para o Natal</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the APG grid pattern lists, including the two a month grid needs that a list does not: PageUp and PageDown move a month, and Shift with either moves a year.',
    snippet: defineSnippet({
      id: 'calendar-angular-keyboard',
      label: 'The keys',
      language: 'angular',
      source: `<!-- ArrowLeft / ArrowRight  a day, mirrored under dir="rtl" -->
<!-- ArrowUp / ArrowDown     the same weekday, a week either way -->
<!-- Home / End              the first and last day of the displayed week -->
<!-- PageUp / PageDown       a month, clamped to the last day it has -->
<!-- Shift + PageUp / Down   a year, on the same terms -->
<!-- Enter / Space           chooses the date focus is on -->
<!-- Escape                  walks down a view, and out of nothing -->
<div slCalendar></div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'SlCalendar',
    'What the calendar holds, which depends on selectionMode. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'SlCalendar',
    'What it starts from when nobody else writes one. Read once; a later change to it is not new state.',
  ],
  [
    'focusedDate',
    'PlainDate',
    '—',
    'SlCalendar',
    'The date the reader is on, which is not the date they have chosen. Present means the consumer owns it, which is what a product that pages a calendar from outside needs.',
  ],
  [
    'defaultFocusedDate',
    'PlainDate',
    'today',
    'SlCalendar',
    'Where the reader starts. Unset, it is the value if there is one and today if there is not.',
  ],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'SlCalendar',
    'How many dates the reader may choose, and what the value then is.',
  ],
  [
    'months',
    'number',
    '1',
    'SlCalendar',
    'How many months are drawn side by side. They wrap when they do not fit; nothing is withdrawn.',
  ],
  [
    'view',
    "'day' | 'month' | 'year'",
    'day',
    'SlCalendar',
    'Which grid is showing. Present means the consumer owns it; defaultView sets the starting one.',
  ],
  ['defaultView', "'day' | 'month' | 'year'", 'day', 'SlCalendar', 'The view it opens on.'],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'SlCalendar',
    'What a choice is. month opens on the months of a year and never shows the day grid: a month cell is the value, written as the first day of that month, the arrow keys move one month or one row of four, Home and End reach January and December, Page Up and Page Down move a year, and Enter or Space chooses. A month the bounds leave no day of carries aria-disabled.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'SlCalendar',
    'The earliest date the reader may reach. An arrow that would leave the range stops at the edge.',
  ],
  ['max', 'PlainDate', '—', 'SlCalendar', 'The latest date the reader may reach.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'SlCalendar',
    'Refuses particular dates. A refused date stays focusable and cannot be chosen.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'SlCalendar',
    'Draws the ISO 8601 week number as a row header.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'false',
    'SlCalendar',
    'Always six rows, so paging does not change the surface’s height. Worth setting inside a popover.',
  ],
  [
    'outsideDays',
    "'shown' | 'selectable' | 'hidden'",
    'shown',
    'SlCalendar',
    'What a day of the month either side does: drawn and not pressable, drawn and pressable, or not drawn.',
  ],
  [
    'marks',
    'ReadonlyMap<string, CalendarMark>',
    '—',
    'SlCalendar',
    'What falls on each day, keyed by its ISO date: a dot under the number in the mark’s tone, and its count in the day’s accessible name (“12, 2 items”). Composes with every selection mode, min, max and outsideDays.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlCalendar',
    'BCP 47. Decides the month names, the weekday names and the day a week starts on.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'SlCalendar', 'Which zone answers "what is today".'],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'SlCalendar',
    '0 is Sunday. Overrides what the locale says, for a product that fixes one.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'SlCalendar',
    'The calendar system. One value today, and an axis rather than a silence.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'SlCalendar',
    'Answers no key and no press, and takes every cell out of the tab sequence.',
  ],
  ['readOnly', 'boolean', '—', 'SlCalendar', 'Readable and not changeable, and never faded.'],
  ['invalid', 'boolean', '—', 'SlCalendar', 'Retargets the focus ring to the danger colour.'],
  [
    'messages',
    'Partial<CalendarMessages>',
    '—',
    'SlCalendar',
    'Words laid over the language in force, key by key: the back (previous) and forward (next) triggers’ accessible names.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<CalendarValue>',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the reason — pointer or keyboard — and the originating event. There is no two-way [(value)]: one slot could carry none of that.',
  },
  {
    name: 'focusedDateChange',
    payload: 'ChangeRequest<PlainDate>',
    when: 'Before the date the reader is on moves, and cancellable. It fires for every arrow and every page, which is what lets a consumer load a month before it is shown.',
  },
  {
    name: 'viewChange',
    payload: 'CalendarView',
    when: 'When the heading walks up a view or Escape walks down one.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideCalendarDefaults',
    'Provider',
    '—',
    'application',
    'Sets timeZone, firstDayOfWeek, months, weekNumbers, fixedWeeks, outsideDays and calendar once for everything under the injector; an input on the calendar still wins.',
  ],
  [
    'exportAs',
    'slCalendar',
    '—',
    'SlCalendar',
    'Hands a template the instance, so focus(), focusDate(), currentView() and the derived selection() signal are reachable without a component of its own.',
  ],
  [
    'focusDate',
    '(date: PlainDate) => void',
    '—',
    'SlCalendar',
    'Moves the reader to a date, paging the grid to reach it — the one action no input can express.',
  ],
  [
    'currentView',
    'Signal<CalendarView>',
    '—',
    'SlCalendar',
    'Which grid is showing, as a signal, so a template reads it without an event handler and without a second copy of it.',
  ],
]);

const accessibility: string[] = [
  'The grid role is on a real table, so the row, column-header and cell roles are implied by tr, th and td and are deliberately not written — the APG’s own note, and the duplication a pattern check exists to refuse.',
  'Exactly one cell is in the tab sequence, and the arrows move it. Focus is only put back into the DOM after a key moved it, never on a render, so a calendar on a page does not steal the reader’s place.',
  'The heading is a polite live region, because paging with a key changes nothing that focus lands on and nothing else would announce the new month.',
  'A column header shows the locale’s narrow weekday and carries the full name in abbr, which is the difference between a screen reader saying "Mo" and saying "Monday".',
  'A date the predicate refuses carries aria-disabled rather than being removed, so a reader can arrow onto it and be told why it is out; and it is struck through as well as dimmed, because colour alone says nothing under forced colours.',
  'Today is a dot under the number and focus is a ring around it. They were the same ring once, and a reader arrowing onto today saw one box and could not tell which of the two facts it was.',
];

export const ANGULAR_CALENDAR_DOCS = {
  calendar: {
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
