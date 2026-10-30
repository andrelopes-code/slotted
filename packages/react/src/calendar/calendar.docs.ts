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

export const REACT_CALENDAR_TOKENS = calendarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Calendar decision',
}));

const imports: ReferenceImport = {
  source: "import { Calendar, CalendarDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The box everything stands in, and the query container the cell size is measured against. Carries data-ui="calendar", data-view, data-months, data-week-numbers and the state attributes. className, style and every native attribute reach it.',
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
      'The year view’s own grid, four across and twelve to a page. The page is anchored rather than centerd, so the year the reader is on keeps its cell between presses.',
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
      id: 'calendar-react-playground',
      label: 'Usage',
      language: 'tsx',
      source: `<Calendar aria-label="Data" locale="pt-BR" onValueChange={setValue} value={value} />;`,
    }),
  },
  {
    id: 'selection',
    title: 'One date',
    note: 'The default mode. Pressing the chosen date again takes it back, which is the only way to empty the value without a control of its own.',
    snippet: defineSnippet({
      id: 'calendar-react-selection',
      label: 'Single',
      language: 'tsx',
      source: `<Calendar selectionMode="single" value={value} onValueChange={setValue} />;`,
    }),
  },
  {
    id: 'range',
    title: 'A run of days',
    note: 'Two presses make a range, and either end may come first: choosing the 11th and then the 7th means the 7th to the 11th. A third press starts again, because a range that only grew could never be narrowed.',
    snippet: defineSnippet({
      id: 'calendar-react-range',
      label: 'Range and set',
      language: 'tsx',
      source: `<>
  <Calendar selectionMode="range" value={run} onValueChange={setRun} />
  <Calendar selectionMode="multiple" value={dates} onValueChange={setDates} />
</>;`,
    }),
  },
  {
    id: 'views',
    title: 'Day, month and year',
    note: 'Press the heading to walk up and Escape to walk down. A reader entering a birth date must not press "previous month" four hundred times, which is what these two views exist to prevent.',
    snippet: defineSnippet({
      id: 'calendar-react-views',
      label: 'Views',
      language: 'tsx',
      source: `<Calendar defaultView="year" onViewChange={setView} />;`,
    }),
  },
  {
    id: 'months',
    title: 'More than one month',
    note: 'Two or three months side by side, each with its own caption because the heading then names the span. Narrow the stage: a month that no longer fits wraps under the first rather than being withdrawn.',
    snippet: defineSnippet({
      id: 'calendar-react-months',
      label: 'Two months',
      language: 'tsx',
      source: `<Calendar months={2} selectionMode="range" />;`,
    }),
  },
  {
    id: 'locale',
    title: 'The locale writes the month',
    note: 'The month name, the weekday names and the day a week starts on all come from Intl. A German week starts on Monday and a Brazilian one on Sunday, from the same component and no table.',
    snippet: defineSnippet({
      id: 'calendar-react-locale',
      label: 'Four locales',
      language: 'tsx',
      source: `<>
  <Calendar locale="pt-BR" />
  <Calendar locale="de-DE" />
  <Calendar locale="ja-JP" />
  <Calendar locale="pt-BR" firstDayOfWeek={1} />
</>;`,
    }),
  },
  {
    id: 'range-bounds',
    title: 'Bounds',
    note: 'min and max fence what the reader may reach: an arrow that would leave the range stops at the edge, and a date outside it cannot be pressed at all.',
    snippet: defineSnippet({
      id: 'calendar-react-range-bounds',
      label: 'min and max',
      language: 'tsx',
      source: `<Calendar max={{ year: 2026, month: 9, day: 30 }} min={{ year: 2026, month: 9, day: 1 }} />;`,
    }),
  },
  {
    id: 'unavailable',
    title: 'Days that are refused',
    note: 'A refused date stays focusable — aria-disabled, never disabled — so a reader can arrow onto it, be told why it is out, and arrow past. Struck through rather than only faded, because color alone says nothing under forced colors.',
    snippet: defineSnippet({
      id: 'calendar-react-unavailable',
      label: 'A predicate',
      language: 'tsx',
      source: `<Calendar isDateUnavailable={(date) => isWeekend(date) || isHoliday(date)} />;`,
    }),
  },
  {
    id: 'week-numbers',
    title: 'Week numbers',
    note: 'ISO 8601 numbering, as a row header separated by a rule. The rule is what keeps the column from reading as an eighth day of the week.',
    snippet: defineSnippet({
      id: 'calendar-react-week-numbers',
      label: 'Week numbers',
      language: 'tsx',
      source: `<Calendar fixedWeeks firstDayOfWeek={1} weekNumbers />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Read-only keeps the value legible and answers nothing; disabled takes every cell out of the tab sequence and paints today in the disabled ink; invalid retargets the focus ring rather than removing it.',
    snippet: defineSnippet({
      id: 'calendar-react-states',
      label: 'The three states',
      language: 'tsx',
      source: `<>
  <Calendar readOnly />
  <Calendar invalid />
  <Calendar disabled />
</>;`,
    }),
  },
  {
    id: 'density',
    title: 'Density and width',
    note: 'Seven columns of two-digit numbers make this the densest grid the library draws. Switch the toolbar to dense and narrow the stage: the cell is the room there is divided by the columns there are, bounded by the WCAG minimum below.',
    snippet: defineSnippet({
      id: 'calendar-react-density',
      label: 'Narrow',
      language: 'tsx',
      source: `<Calendar fixedWeeks />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'A provider sets the shape once, SlottedProvider the language; focusedDate is a value of its own a consumer may own; and the ref hands back focus() and focusDate(), which page the grid to reach a date.',
    snippet: defineSnippet({
      id: 'calendar-react-composition',
      label: 'Provider and handle',
      language: 'tsx',
      source: `<CalendarDefaultsProvider fixedWeeks>
  <Calendar focusedDate={focused} onFocusedDateChange={setFocused} ref={handle} />
</CalendarDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Every key the APG grid pattern lists, including the two a month grid needs that a list does not: PageUp and PageDown move a month, and Shift with either moves a year.',
    snippet: defineSnippet({
      id: 'calendar-react-keyboard',
      label: 'The keys',
      language: 'tsx',
      source: `// ArrowLeft / ArrowRight  a day, mirrored under dir="rtl"
// ArrowUp / ArrowDown     the same weekday, a week either way
// Home / End              the first and last day of the displayed week
// PageUp / PageDown       a month, clamped to the last day it has
// Shift + PageUp / Down   a year, on the same terms
// Enter / Space           chooses the date focus is on
// Escape                  walks down a view, and out of nothing`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'Calendar',
    'What the calendar holds, which depends on selectionMode. Present means the consumer owns it.',
  ],
  [
    'defaultValue',
    'PlainDate | DateRange | PlainDate[] | null',
    '—',
    'Calendar',
    'What it starts from when nobody else writes one. Read once; a later change to it is not new state.',
  ],
  [
    'focusedDate',
    'PlainDate',
    '—',
    'Calendar',
    'The date the reader is on, which is not the date they have chosen. Present means the consumer owns it, which is what a product that pages a calendar from outside needs.',
  ],
  [
    'defaultFocusedDate',
    'PlainDate',
    'today',
    'Calendar',
    'Where the reader starts. Unset, it is the value if there is one and today if there is not.',
  ],
  [
    'selectionMode',
    "'single' | 'range' | 'multiple'",
    'single',
    'Calendar',
    'How many dates the reader may choose, and what the value then is.',
  ],
  [
    'months',
    'number',
    '1',
    'Calendar',
    'How many months are drawn side by side. They wrap when they do not fit; nothing is withdrawn.',
  ],
  [
    'view',
    "'day' | 'month' | 'year'",
    'day',
    'Calendar',
    'Which grid is showing. Present means the consumer owns it; defaultView sets the starting one.',
  ],
  ['defaultView', "'day' | 'month' | 'year'", 'day', 'Calendar', 'The view it opens on.'],
  [
    'granularity',
    "'day' | 'month'",
    'day',
    'Calendar',
    'What a choice is. month opens on the months of a year and never shows the day grid: a month cell is the value, written as the first day of that month, the arrow keys move one month or one row of four, Home and End reach January and December, Page Up and Page Down move a year, and Enter or Space chooses. A month the bounds leave no day of carries aria-disabled.',
  ],
  [
    'min',
    'PlainDate',
    '—',
    'Calendar',
    'The earliest date the reader may reach. An arrow that would leave the range stops at the edge.',
  ],
  ['max', 'PlainDate', '—', 'Calendar', 'The latest date the reader may reach.'],
  [
    'isDateUnavailable',
    '(date: PlainDate) => boolean',
    '—',
    'Calendar',
    'Refuses particular dates. A refused date stays focusable and cannot be chosen.',
  ],
  [
    'weekNumbers',
    'boolean',
    'false',
    'Calendar',
    'Draws the ISO 8601 week number as a row header.',
  ],
  [
    'fixedWeeks',
    'boolean',
    'false',
    'Calendar',
    'Always six rows, so paging does not change the surface’s height. Worth setting inside a popover.',
  ],
  [
    'outsideDays',
    "'shown' | 'selectable' | 'hidden'",
    'shown',
    'Calendar',
    'What a day of the month either side does: drawn and not pressable, drawn and pressable, or not drawn.',
  ],
  [
    'marks',
    'ReadonlyMap<string, CalendarMark>',
    '—',
    'Calendar',
    'What falls on each day, keyed by its ISO date: a dot under the number in the mark’s tone, and its count in the day’s accessible name (“12, 2 items”). Composes with every selection mode, min, max and outsideDays.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'Calendar',
    'BCP 47. Decides the month names, the weekday names and the day a week starts on.',
  ],
  ['timeZone', 'string', 'the runtime’s', 'Calendar', 'Which zone answers "what is today".'],
  [
    'firstDayOfWeek',
    'number',
    'the locale’s',
    'Calendar',
    '0 is Sunday. Overrides what the locale says, for a product that fixes one.',
  ],
  [
    'calendar',
    "'gregory'",
    'gregory',
    'Calendar',
    'The calendar system. One value today, and an axis rather than a silence.',
  ],
  [
    'disabled',
    'boolean',
    '—',
    'Calendar',
    'Answers no key and no press, and takes every cell out of the tab sequence.',
  ],
  ['readOnly', 'boolean', '—', 'Calendar', 'Readable and not changeable, and never faded.'],
  ['invalid', 'boolean', '—', 'Calendar', 'Retargets the focus ring to the danger color.'],
  [
    'messages',
    'Partial<CalendarMessages>',
    '—',
    'Calendar',
    'Words laid over the language in force, key by key: the back (previous) and forward (next) triggers’ accessible names.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: CalendarValue, request: ChangeRequest<CalendarValue>)',
    when: 'Before the value moves, and cancellable. The request carries the new value, the value it replaces, the reason — pointer or keyboard — and the originating event.',
  },
  {
    name: 'onFocusedDateChange',
    payload: '(date: PlainDate, request: ChangeRequest<PlainDate>)',
    when: 'Before the date the reader is on moves, and cancellable. It fires for every arrow and every page, which is what lets a consumer load a month before it is shown.',
  },
  {
    name: 'onViewChange',
    payload: '(view: CalendarView)',
    when: 'When the heading walks up a view or Escape walks down one.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'CalendarDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets timeZone, firstDayOfWeek, months, weekNumbers, fixedWeeks, outsideDays and calendar once for everything under it; a prop on the calendar still wins.',
  ],
  [
    'render',
    '(props: CalendarRootProps) => ReactNode',
    '—',
    'Calendar',
    'Substitutes the element the root renders. The props carry the ref, which the family reaches its own cells through.',
  ],
  [
    'ref',
    'Ref<CalendarHandle>',
    '—',
    'Calendar',
    'focus() puts the reader on the cell holding the tab stop; focusDate() moves them to a date, paging the grid to reach it.',
  ],
  [
    'onKeyDown',
    'KeyboardEventHandler',
    '—',
    'Calendar',
    'Runs before the family acts, and calling preventDefault stops it acting at all — which is how a surface above the calendar takes a key first.',
  ],
]);

const accessibility: string[] = [
  'The grid role is on a real table, so the row, column-header and cell roles are implied by tr, th and td and are deliberately not written — the APG’s own note, and the duplication a pattern check exists to refuse.',
  'Exactly one cell is in the tab sequence, and the arrows move it. Focus is only put back into the DOM after a key moved it, never on a render, so a calendar on a page does not steal the reader’s place.',
  'The heading is a polite live region, because paging with a key changes nothing that focus lands on and nothing else would announce the new month.',
  'A column header shows the locale’s narrow weekday and carries the full name in abbr, which is the difference between a screen reader saying "Mo" and saying "Monday".',
  'A date the predicate refuses carries aria-disabled rather than being removed, so a reader can arrow onto it and be told why it is out; and it is struck through as well as dimmed, because color alone says nothing under forced colors.',
  'Today is a dot under the number and focus is a ring around it. They were the same ring once, and a reader arrowing onto today saw one box and could not tell which of the two facts it was.',
];

export const REACT_CALENDAR_DOCS = {
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
