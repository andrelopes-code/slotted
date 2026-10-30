import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import eventCalendarTokens from '@slotted/styles/event-calendar/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_EVENT_CALENDAR_TOKENS = eventCalendarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlEventCalendar decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlEventCalendar,\n  SlEventCalendarActions,\n  SlEventCalendarDayContent,\n  SlEventCalendarDetail,\n  SlEventCalendarEmpty,\n  SlEventCalendarError,\n  SlEventCalendarEvent,\n  provideEventCalendarDefaults,\n} from '@slotted/angular/event-calendar';\nimport { wallClockIn } from '@slotted/core/date';",
  selector: '[slEventCalendar]',
  exportAs: 'slEventCalendar',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div slEventCalendar',
    required: true,
    purpose:
      'data-ui="event-calendar", data-view, data-layout (grid or list), data-loading, data-slot-duration. The query container every reflow answers.',
  },
  {
    part: 'header',
    element: 'div',
    required: false,
    purpose:
      'Title, navigation, views, filter and actions, in three compositions by width. Absent with header={false}.',
  },
  {
    part: 'title',
    element: 'div role=heading (aria-level = level)',
    required: true,
    purpose: 'The period in view; a polite live region, and the name of the grid.',
  },
  {
    part: 'navigation',
    element: 'div role=group',
    required: true,
    purpose: 'Previous, Today and Next.',
  },
  {
    part: 'previous',
    element: 'button',
    required: true,
    purpose: 'One period back; its name says which period. The chevron turns in RTL.',
  },
  {
    part: 'today',
    element: 'button',
    required: true,
    purpose: 'To the period holding today in timeZone.',
  },
  { part: 'next', element: 'button', required: true, purpose: 'One period forward.' },
  {
    part: 'views',
    element: 'div holding slSegmentedControl',
    required: false,
    purpose: 'The views offered, with more than one.',
  },
  {
    part: 'filter',
    element: 'button [slMenuTriggerFor] and its sl-menu',
    required: false,
    purpose:
      'Checkbox items, one per calendar with its swatch; with two calendars or more. Only its funnel shows under 480 pixels.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose: 'The consumer’s controls: New event, Subscribe.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose:
      'The grid or the list; aria-busy while loading. Keyboard and pointer selection are handled here.',
  },
  {
    part: 'loader',
    element: 'div holding slProgressBar',
    required: true,
    purpose: 'The one indicator of a wait, on the body’s top edge, after loadingDelay.',
  },
  {
    part: 'error',
    element: 'div',
    required: false,
    purpose: 'The consumer’s error node, above the grid, which stays usable.',
  },
  {
    part: 'month',
    element: 'table role=grid',
    required: false,
    purpose: 'The month, labelled by the title.',
  },
  { part: 'weekdays', element: 'tr', required: false, purpose: 'The column headers.' },
  {
    part: 'week-number-header',
    element: 'th',
    required: false,
    purpose: 'With weekNumbers; its word is visually hidden.',
  },
  {
    part: 'weekday',
    element: 'th, or span in a column header',
    required: false,
    purpose: 'Short weekday; abbr holds the full name.',
  },
  {
    part: 'week',
    element: 'tr',
    required: false,
    purpose: 'One week; reserves maxEvents lanes and a line for +N.',
  },
  {
    part: 'week-number',
    element: 'th scope=row',
    required: false,
    purpose: 'The ISO week number.',
  },
  {
    part: 'day',
    element: 'td role=gridcell',
    required: false,
    purpose:
      'One day; the roving tab stop; data-today, data-outside-month, data-non-working, data-selected, data-date.',
  },
  {
    part: 'day-header',
    element: 'div',
    required: false,
    purpose: 'The day’s number and its content.',
  },
  {
    part: 'day-number',
    element: 'button',
    required: false,
    purpose: 'Opens the day view on that date; named by the full date.',
  },
  {
    part: 'day-content',
    element: 'div',
    required: false,
    purpose:
      'ng-template[slEventCalendarDayContent]: a price, a count of free slots, who is on call.',
  },
  { part: 'day-events', element: 'div', required: false, purpose: 'The lanes of a day.' },
  {
    part: 'event',
    element: 'a with href, button without',
    required: true,
    purpose:
      'One occurrence: data-key, data-color, data-status, data-bar, data-open, the continuation and clipping flags. Its content is its name.',
  },
  {
    part: 'event-time',
    element: 'span',
    required: false,
    purpose: 'The start, or the range, in the locale’s clock.',
  },
  {
    part: 'event-title',
    element: 'span',
    required: true,
    purpose: 'Truncated with an ellipsis, never removed.',
  },
  {
    part: 'event-location',
    element: 'span',
    required: false,
    purpose: 'In a tall block and in the list.',
  },
  {
    part: 'event-meta',
    element: 'span, visually hidden',
    required: true,
    purpose: 'The full range, the calendar, the status, repeats.',
  },
  {
    part: 'resize-handle',
    element: 'span aria-hidden',
    required: false,
    purpose:
      'The end an edit pulls: the bottom of a block, the inline end of a bar. Its grip shows on hover and focus.',
  },
  {
    part: 'continuation',
    element: 'span, visually hidden',
    required: false,
    purpose: 'A multi-day bar crossing this day after its first.',
  },
  {
    part: 'more',
    element: 'button',
    required: false,
    purpose: '+N: opens a popover with every event of the day.',
  },
  {
    part: 'time-grid',
    element: 'div role=grid',
    required: false,
    purpose: 'Week and day, labelled by the title.',
  },
  {
    part: 'time-head',
    element: 'div role=rowgroup',
    required: false,
    purpose: 'The rows that do not scroll.',
  },
  { part: 'columns', element: 'div role=row', required: false, purpose: 'The column headers.' },
  {
    part: 'zone',
    element: 'div role=columnheader',
    required: false,
    purpose: 'The zone’s offset, GMT-3.',
  },
  {
    part: 'column-header',
    element: 'div role=columnheader',
    required: false,
    purpose: 'Weekday, date and content; a tab stop in the header row.',
  },
  {
    part: 'offset-change',
    element: 'span role=note',
    required: false,
    purpose: 'The day the clocks move: “−1 h at 2:00 AM”, the full sentence as its name.',
  },
  { part: 'all-day-row', element: 'div role=row', required: false, purpose: 'The all-day lanes.' },
  { part: 'all-day-label', element: 'div role=rowheader', required: false, purpose: 'All day.' },
  {
    part: 'all-day-cell',
    element: 'div role=gridcell',
    required: false,
    purpose: 'One day’s all-day and multi-day bars.',
  },
  {
    part: 'scroller',
    element: 'div role=rowgroup',
    required: false,
    purpose: 'Scrolls the hours; opens on scrollTime.',
  },
  { part: 'time-row', element: 'div role=row', required: false, purpose: 'The row of hours.' },
  {
    part: 'gutter',
    element: 'div role=rowheader',
    required: false,
    purpose: 'Hour labels, aria-hidden; its name says timed events.',
  },
  {
    part: 'hour',
    element: 'span',
    required: false,
    purpose: 'One hour label, on the line it names.',
  },
  {
    part: 'column',
    element: 'div role=gridcell',
    required: false,
    purpose: 'One day’s hours: events positioned by minute, column and span.',
  },
  {
    part: 'off-hours',
    element: 'div aria-hidden',
    required: false,
    purpose: 'A stretch outside workingHours.',
  },
  {
    part: 'now',
    element: 'div aria-hidden',
    required: false,
    purpose: 'The current time in timeZone, ticked each minute.',
  },
  {
    part: 'offset-line',
    element: 'div aria-hidden',
    required: false,
    purpose: 'The minute the zone’s offset changes.',
  },
  {
    part: 'selection',
    element: 'div aria-hidden',
    required: false,
    purpose: 'The chosen stretch of a column, with its range written in it.',
  },
  {
    part: 'list',
    element: 'div',
    required: false,
    purpose: 'The list layout, and the month and week below 600 pixels.',
  },
  {
    part: 'list-day',
    element: 'section',
    required: false,
    purpose: 'One day holding events, labelled by its heading.',
  },
  {
    part: 'list-day-heading',
    element: 'div role=heading (aria-level = level + 1)',
    required: false,
    purpose: 'The day, in its two parts below.',
  },
  {
    part: 'detail-day',
    element: 'span',
    required: false,
    purpose:
      'The day of the open event, in its detail’s description; absent when the range names its days.',
  },
  {
    part: 'detail-range',
    element: 'span',
    required: false,
    purpose: 'Its hours or its days; it wraps after the day and never inside itself.',
  },
  {
    part: 'list-weekday',
    element: 'span',
    required: false,
    purpose: 'The weekday, small, over the date.',
  },
  {
    part: 'list-date',
    element: 'span',
    required: false,
    purpose: 'The date without its weekday; one line of its own, never broken inside itself.',
  },
  {
    part: 'list-events',
    element: 'ul role=list',
    required: false,
    purpose: 'The day’s events in order.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'The list’s empty sentence and the consumer’s empty node.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'The studio’s calendar',
    note: 'Every model unbound: switch views, page, filter the calendars, press an event to open its detail and drag across empty hours to choose a stretch. The line under it says what the calendar asked for.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-playground',
      language: 'angular',
      label: 'Events in, requests out',
      source: `<div
  slEventCalendar
  [calendars]="calendars"
  [events]="events"
  selectionMode="range"
  timeZone="America/Sao_Paulo"
  (rangeChange)="fetch($event)"
>
  <ng-template slEventCalendarDetail let-occurrence
    ><app-event-summary [occurrence]="occurrence"
  /></ng-template>
</div>`,
    }),
  },
  {
    id: 'views',
    title: 'Which views, in what order',
    note: '[views] sets the switcher and its order; the first is the one an unbound calendar opens on. A booking page that only lists and a planner without a list are the same family.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-views',
      language: 'angular',
      label: 'A planner with three views',
      source: `<div slEventCalendar [events]="events" [views]="['week', 'day', 'month']"></div>`,
    }),
  },
  {
    id: 'month',
    title: 'The month',
    note: 'All-day and multi-day events are bars; a meeting of one day is a dot, a time and a title. A bar running into next week stops in its cell with a chevron; the week number, the outside days and the continuous run of chosen days all show here.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-month',
      language: 'angular',
      label: 'Week numbers and a fixed six-row grid',
      source: `<div slEventCalendar [events]="events" fixedWeeks weekNumbers></div>`,
    }),
  },
  {
    id: 'week',
    title: 'The week',
    note: 'Blocks stand off the rules and off each other. The all-day lane holds bars across days, today’s column carries the now line, and the hours open on scrollTime. Hide the weekend for a working week.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-week',
      language: 'angular',
      label: 'A working week from eight to eight',
      source: `<div
  slEventCalendar
  [events]="events"
  [dayHours]="[8, 20]"
  defaultView="week"
  weekends="hidden"
></div>`,
    }),
  },
  {
    id: 'day',
    title: 'The day',
    note: 'One column with room for the location under each title. The previous and next buttons step one day, and skip Saturday and Sunday when the weekend is hidden.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-day',
      language: 'angular',
      label: 'Quarter-hour slots',
      source: `<div slEventCalendar [events]="events" defaultView="day" [slotDuration]="15"></div>`,
    }),
  },
  {
    id: 'list',
    title: 'The list',
    note: 'A heading per day that holds an event and nothing for the days that hold none. Every event is in the tab order; the time has a column of its own so the titles align down the page.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-list',
      language: 'angular',
      label: 'A month as an agenda',
      source: `<div slEventCalendar [events]="events" defaultView="list" listRange="month"></div>`,
    }),
  },
  {
    id: 'all-day',
    title: 'All-day, multi-day and past midnight',
    note: 'A start without a time is a whole day, and its end is the last day, inclusive. The release window runs from 10 PM to 2 AM: one block per day in the week, one bar in the month labelled with its start.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-all-day',
      language: 'angular',
      label: 'The kind of start decides',
      source: `<div slEventCalendar [events]="[conference, releaseWindow]" defaultView="week"></div>`,
    }),
  },
  {
    id: 'overlap',
    title: 'Overlapping events',
    note: 'Events that overlap share the day in columns, each spanning the free columns to its right; no text is covered. Five hiring panels at the same hour draw two columns and a +3 that opens the day.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-overlap',
      language: 'angular',
      label: 'How many columns before +N',
      source: `<div slEventCalendar [events]="events" defaultView="week" [maxColumns]="4"></div>`,
    }),
  },
  {
    id: 'recurrence',
    title: 'Recurrence, exceptions and a moved occurrence',
    note: 'The standup repeats every weekday and skips Labor Day; planning repeats every other Monday, and the one on the 21st was moved to Tuesday afternoon. A rule outside the subset degrades to a single occurrence.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-recurrence',
      language: 'angular',
      label: 'recurrence, exceptions, recurrenceOf and occurrence',
      source: `<div slEventCalendar [events]="[standup, movedPlanning]" defaultView="week"></div>`,
    }),
  },
  {
    id: 'time-zone',
    title: 'Time zones and the day the clocks change',
    note: 'The calendar draws wall-clock time. The application converts its instants once with wallClockIn; timeZone decides today, the now line and the gutter’s label. On 1 November in New York the header says the clocks go back at 2 AM and the column marks the minute.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-time-zone',
      language: 'angular',
      label: 'Instants converted once, in the component',
      source: `<div slEventCalendar [events]="shifts" [timeZone]="zone" defaultView="day"></div>`,
    }),
  },
  {
    id: 'calendars',
    title: 'Calendars and their colors',
    note: 'Each calendar takes a slot of the data palette in order and never cycles. The filter is a menu of checkboxes; a predicate composes a search on top. Color is identity only: the calendar is also in every event’s name.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-calendars',
      language: 'angular',
      label: 'Two-way visibility and a search',
      source: `<div
  slEventCalendar
  [calendars]="calendars"
  [events]="events"
  [(visibleCalendars)]="visible"
  [filter]="matches"
>
  <div slTextField slEventCalendarActions size="sm">
    <input slTextFieldInput type="search" aria-label="Search events" (input)="search($event)" />
  </div>
</div>`,
    }),
  },
  {
    id: 'working-hours',
    title: 'Working hours',
    note: 'The hours outside workingHours are shaded, and a day no entry names is shaded whole. Shading informs and does not refuse: whether a slot outside hours can be booked is the application’s rule.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-working-hours',
      language: 'angular',
      label: 'A clinic open in two shifts',
      source: `<div slEventCalendar [events]="appointments" [workingHours]="shifts" defaultView="week"></div>`,
    }),
  },
  {
    id: 'day-content',
    title: 'What a domain writes on a day',
    note: 'An ng-template with slEventCalendarDayContent writes into every day header: who is on call here, a nightly price on a booking page, free slots in a clinic. It sits at the end of the header line in the month and under the date in the week.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-day-content',
      language: 'angular',
      label: 'One template for every day',
      source: `<div slEventCalendar [events]="events">
  <ng-template slEventCalendarDayContent let-date>{{ onCall(date) }}</ng-template>
</div>`,
    }),
  },
  {
    id: 'detail',
    title: 'Opening an event',
    note: 'With an ng-template carrying slEventCalendarDetail the family opens a popover anchored to the event and gives it back focus on close. Without one, (openEventRequest) asks and the application opens its own drawer; the open event keeps aria-expanded either way.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-detail',
      language: 'angular',
      label: 'A detail the family hosts',
      source: `<div slEventCalendar [events]="events">
  <ng-template slEventCalendarDetail let-occurrence let-close="close">
    <app-event-summary [occurrence]="occurrence" (edit)="close()" />
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'context-menu',
    title: 'Commands on a right click',
    note: 'With an ng-template carrying slEventCalendarContextMenu a secondary click, a long press or Shift+F10 opens the context-menu family on what was pointed at: an event, the selection when the pointer is inside it, one step of the hours, or a day. The event is drawn solid and a stretch as the selection being made; slEventCalendarContextMenuFor leaves the browser’s own menu on the targets it refuses.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-context-menu',
      language: 'angular',
      label: 'Items per target',
      source: `<div slEventCalendar [events]="events">
  <ng-template slEventCalendarContextMenu let-target>
    @if (target.kind === 'event') {
      <button slMenuItem (select)="duplicate(target.occurrence)">Duplicate</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger" (select)="remove(target.occurrence)">Delete</button>
    } @else {
      <button slMenuItem (select)="openCreateDialog(target.slot)">New event</button>
    }
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'selection',
    title: 'Choosing a stretch to create an event',
    note: 'Drag across empty hours or days, or press Space on a day and extend with Shift and the arrows. The calendar asks with the stretch and a reason; the application opens its form and clears the selection when done.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-selection',
      language: 'angular',
      label: 'The selection is a request to create',
      source: `<div
  slEventCalendar
  [events]="events"
  selectionMode="range"
  [(selection)]="selection"
  (selectionRequest)="create($event)"
></div>`,
    }),
  },
  {
    id: 'editing',
    title: 'Moving and resizing',
    note: 'With editable, a press that travels four pixels picks an event up and lays it out where it would land; its end pulls to resize. Release asks with eventChangeRequest; Escape puts it back. Alt with the arrows does the same from the keyboard. A series asks with the occurrence’s own date. canDrop is asked about every destination with the same change: a refused one is drawn with a dashed danger edge, letting go there asks nothing, and Alt with an arrow passes over it to the next allowed one.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-editing',
      language: 'angular',
      label: 'The application writes the move back',
      source: `<div
  slEventCalendar
  editable
  [canDrop]="notAtWeekends"
  [events]="events()"
  (eventChangeRequest)="move($event.value)"
></div>`,
    }),
  },
  {
    id: 'loading',
    title: 'Loading a new range',
    note: 'The grid is structure the date decides, so it stays painted; one bar on its top edge says events are coming, after loadingDelay, and holds for loadingMinDuration. Events already drawn stay until the new ones arrive.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-loading',
      language: 'angular',
      label: 'One input for the wait',
      source: `<div
  slEventCalendar
  [events]="events()"
  [loading]="fetching()"
  (rangeChange)="range.set($event)"
></div>`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing this week',
    note: 'The list says so in a sentence and carries the application’s next step. The grid needs no sentence: an empty month is visibly empty.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-empty',
      language: 'angular',
      label: 'The action that creates the first one',
      source: `<div slEventCalendar [events]="[]" defaultView="list">
  <button slButton slEventCalendarEmpty type="button">New event</button>
</div>`,
    }),
  },
  {
    id: 'error',
    title: 'A range that failed',
    note: 'The error sits above the grid with the application’s retry; paging, the views and the filter keep working, because the failure is the data’s, not the calendar’s.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-error',
      language: 'angular',
      label: 'An alert with a retry',
      source: `<div slEventCalendar [events]="events">
  <div slAlert slEventCalendarError tone="danger">The events could not be loaded.</div>
</div>`,
    }),
  },
  {
    id: 'compact',
    title: 'On a phone',
    note: 'Below 600 pixels the month and the week draw as a list of the same days and the view does not change. With compact="keep" the grid stays: events become marks of color, the day is the target, and each keeps its name. At that width the “+N” panel and the detail are sheets from the bottom edge rather than popovers.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-compact',
      language: 'angular',
      label: 'Keep the grid on a phone',
      source: `<div slEventCalendar [events]="events" compact="keep"></div>`,
    }),
  },
  {
    id: 'custom-event',
    title: 'Drawing the inside of an event',
    note: 'An ng-template with slEventCalendarEvent replaces what an event shows and keeps the element, its name, its focus and its geometry. The context says where it is drawn — lane, bar, block or list — and the time the family would write.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-custom-event',
      language: 'angular',
      label: 'An owner’s name under a block',
      source: `<div slEventCalendar [events]="events" defaultView="day">
  <ng-template slEventCalendarEvent let-occurrence let-time="time">
    <span data-part="event-title">{{ occurrence.event.title }}</span>
    <span data-part="event-time">{{ time }}</span>
    <span data-part="event-location">{{ occurrence.event.owner }}</span>
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'locale',
    title: 'Locale, clock and direction',
    note: 'Portuguese starts the week on Sunday and writes a 24-hour clock; Hebrew mirrors the grid, the chevrons and the bars, and an English title on a Hebrew page keeps its own direction.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-locale',
      language: 'angular',
      label: 'Every word replaceable, once',
      source: `<div slEventCalendar [events]="events"></div>`,
    }),
  },
  {
    id: 'density',
    title: 'Density',
    note: 'An hour is two small controls tall — 60, 52 and 48 pixels — and a lane is the inside of one, so dense shrinks the grid the way it shrinks the controls around it. Switch the toolbar to compare.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-density',
      language: 'angular',
      label: 'The hour is a theme decision',
      source: `<div data-slotted-density="dense">
  <div slEventCalendar [events]="events" defaultView="week"></div>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches one day. Arrows move the day, Page Up and Down the period, Home and End the week; in the week Up and Down move between the header, all-day and hours rows. Enter goes into a day, Up and Down walk its events, Escape comes back.',
    snippet: defineSnippet({
      id: 'event-calendar-angular-keyboard',
      language: 'angular',
      label: 'Focus a date or an event from outside',
      source: `<div slEventCalendar #calendar="slEventCalendar" [events]="events"></div>
<button type="button" (click)="calendar.focusDate(firstOfOctober)">Focus 1 October</button>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'dateRequest',
    payload: 'ChangeRequest<PlainDate>',
    when: 'Before the day moves: Previous, Next, Today, a day number (pointer, keyboard), an arrow or Page key (keyboard), focusDate (programmatic). cancel() refuses it; [(date)] then stays.',
  },
  {
    name: 'viewRequest',
    payload: 'ChangeRequest<EventCalendarView>',
    when: 'Before the view moves: the switcher, or a day number drilling into the day.',
  },
  {
    name: 'visibleCalendarsRequest',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'Before a calendar is shown or hidden from the filter menu (pointer, keyboard).',
  },
  {
    name: 'selectionRequest',
    payload: 'ChangeRequest<EventCalendarSelection | null>',
    when: 'Before the chosen stretch moves: a drag (pointer), Space or Shift and the arrows (keyboard), Escape (escape).',
  },
  {
    name: 'openEventRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before an event opens or closes: a press (pointer, keyboard), the close button (dismiss), Escape (escape), a press outside (outsidePress), close() (programmatic).',
  },
  {
    name: 'eventChangeRequest',
    payload: 'ChangeRequest<{ key, event, occurrence, recurring, kind, start, end }>',
    when: 'Before an event moves or its end does: a drag released (pointer), Alt or Alt+Shift with an arrow (keyboard). start and end are in the kind the event holds. Not a model: the application answers by changing events.',
  },
  {
    name: 'rangeChange',
    payload: '{ start: PlainDate; end: PlainDate; view }',
    when: 'After the period in view changes, the first render included. A fact to fetch by.',
  },
];

export const ANGULAR_EVENT_CALENDAR_DOCS = {
  eventCalendar: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'events',
        'readonly CalendarEvent[]',
        '[]',
        'slEventCalendar',
        'The consumer’s events; a start without a time is all-day',
      ],
      [
        'calendars',
        'readonly EventCalendarCalendar[]',
        '[]',
        'slEventCalendar',
        'Key, label and an optional color slot 1–8',
      ],
      [
        'date',
        'model<PlainDate | undefined>',
        '—',
        'slEventCalendar',
        'The day the calendar is on; [(date)] two-way',
      ],
      [
        'defaultDate',
        'PlainDate',
        'today in timeZone',
        'slEventCalendar',
        'Read once; pass it when rendering on a server',
      ],
      [
        'now',
        'PlainDateTime',
        'the clock in timeZone, ticked each minute',
        'slEventCalendar',
        'Present means the consumer owns it: the clock is no longer read, and today and the now line follow it. A page dated by its content passes it.',
      ],
      [
        'view',
        'model<EventCalendarView | undefined>',
        'month',
        'slEventCalendar',
        '[(view)] two-way; unbound opens on the first of views',
      ],
      ['defaultView', 'EventCalendarView', 'views[0]', 'slEventCalendar', 'Read once'],
      [
        'views',
        'readonly EventCalendarView[]',
        'month,week,day,list',
        'slEventCalendar',
        'The switcher, in order',
      ],
      [
        'visibleCalendars',
        'model<readonly string[] | undefined>',
        '—',
        'slEventCalendar',
        'Keys drawn; [(visibleCalendars)] two-way',
      ],
      [
        'defaultVisibleCalendars',
        'readonly string[]',
        'every calendar',
        'slEventCalendar',
        'Read once',
      ],
      [
        'selectionMode',
        "'none' | 'range'",
        'none',
        'slEventCalendar',
        'Whether empty time can be chosen',
      ],
      [
        'selection',
        'model<EventCalendarSelection | null | undefined>',
        '—',
        'slEventCalendar',
        'The chosen stretch; [(selection)] two-way',
      ],
      ['defaultSelection', 'EventCalendarSelection | null', 'null', 'slEventCalendar', 'Read once'],
      [
        'openEvent',
        'model<string | null | undefined>',
        '—',
        'slEventCalendar',
        'The open occurrence’s key; [(openEvent)] two-way',
      ],
      ['defaultOpenEvent', 'string | null', 'null', 'slEventCalendar', 'Read once'],
      [
        'filter',
        '(occurrence) => boolean',
        '—',
        'slEventCalendar',
        'Keeps an occurrence when true',
      ],
      [
        'editable',
        'boolean | (occurrence) => boolean',
        'false',
        'slEventCalendar',
        'Events move and resize, by dragging or by Alt and the arrows',
      ],
      [
        'canDrop',
        '(change) => boolean',
        '—',
        'slEventCalendar',
        'Whether a destination is allowed, asked with the change eventChangeRequest would carry',
      ],
      [
        'workingHours',
        'readonly WorkingHours[]',
        '[]',
        'slEventCalendar',
        'Shades the time outside them',
      ],
      [
        'header',
        'boolean',
        'true',
        'slEventCalendar',
        'false draws none, for a calendar driven from outside',
      ],
      ['loading', 'boolean', 'false', 'slEventCalendar', 'Events are coming; the grid stays'],
      [
        'loadingDelay',
        'number',
        '200',
        'slEventCalendar, provideEventCalendarDefaults',
        'Milliseconds before the indicator shows',
      ],
      [
        'loadingMinDuration',
        'number',
        '400',
        'slEventCalendar, provideEventCalendarDefaults',
        'Milliseconds it holds once shown',
      ],
      [
        'level',
        'number',
        '2',
        'slEventCalendar',
        'The title’s heading level; list days are one below',
      ],
      [
        'compact',
        "'list' | 'keep'",
        'list',
        'slEventCalendar, provideEventCalendarDefaults',
        'Month and week below 600 pixels',
      ],
      [
        'dayHours',
        'readonly [number, number]',
        '0,24',
        'slEventCalendar, provideEventCalendarDefaults',
        'The first visible hour and the hour the grid stops at',
      ],
      [
        'scrollTime',
        'PlainTime',
        '07:00',
        'slEventCalendar, provideEventCalendarDefaults',
        'Where the hours open',
      ],
      [
        'slotDuration',
        'number',
        '30',
        'slEventCalendar, provideEventCalendarDefaults',
        'Minutes between rules, 5 to 120, and the step of a selection, a drag and Alt with an arrow',
      ],
      [
        'maxEvents',
        'number',
        '3',
        'slEventCalendar, provideEventCalendarDefaults',
        'Lanes a month day draws before +N',
      ],
      [
        'maxColumns',
        'number',
        '6',
        'slEventCalendar, provideEventCalendarDefaults',
        'Columns a cluster takes before +N, never more than fit at 56 pixels each',
      ],
      [
        'weekends',
        "'shown' | 'hidden'",
        'shown',
        'slEventCalendar, provideEventCalendarDefaults',
        'A working week',
      ],
      [
        'weekNumbers',
        'boolean',
        'false',
        'slEventCalendar, provideEventCalendarDefaults',
        'ISO week numbers in the month',
      ],
      [
        'fixedWeeks',
        'boolean',
        'false',
        'slEventCalendar, provideEventCalendarDefaults',
        'Six rows in every month',
      ],
      [
        'listRange',
        "'week' | 'month'",
        'week',
        'slEventCalendar, provideEventCalendarDefaults',
        'The period of the list view',
      ],
      [
        'locale',
        'string',
        'provideSlotted',
        'slEventCalendar',
        'BCP 47; decides the first day and the clock. Unset, the language in force decides',
      ],
      [
        'timeZone',
        'string',
        'runtime',
        'slEventCalendar, provideEventCalendarDefaults',
        'Today, now and the gutter’s label',
      ],
      [
        'firstDayOfWeek',
        'number',
        'locale',
        'slEventCalendar, provideEventCalendarDefaults',
        '0 is Sunday',
      ],
      [
        'hourCycle',
        "'h12' | 'h23'",
        'locale',
        'slEventCalendar, provideEventCalendarDefaults',
        'The clock',
      ],
      [
        'messages',
        'Partial<EventCalendarMessages>',
        '—',
        'slEventCalendar',
        'Words laid over the language in force, key by key; a group (previous, next, view, empty) is laid over entry by entry',
      ],
      [
        'ng-template[slEventCalendarEvent]',
        'TemplateRef<{ $implicit, layout, date, time }>',
        '—',
        'content',
        'Replaces an event’s content, not its element',
      ],
      [
        'ng-template[slEventCalendarDetail]',
        'TemplateRef<{ $implicit, close }>',
        '—',
        'content',
        'Given, the family hosts the detail popover',
      ],
      [
        'ng-template[slEventCalendarContextMenu]',
        'TemplateRef<{ $implicit: EventCalendarContextTarget }>',
        '—',
        'content',
        'Given, the body is a context-menu target; the target is { kind: "event", occurrence } or { kind: "slot", slot }',
      ],
      [
        '[slEventCalendarContextMenuFor]',
        '(target) => boolean',
        'every target',
        'content',
        'The targets that have a menu; the others keep the browser’s own',
      ],
      [
        'ng-template[slEventCalendarDayContent]',
        'TemplateRef<{ $implicit: PlainDate, view }>',
        '—',
        'content',
        'Writes into every day header',
      ],
      ['[slEventCalendarActions]', 'element', '—', 'content', 'Projected at the end of the header'],
      [
        '[slEventCalendarEmpty]',
        'element',
        '—',
        'content',
        'Projected after the list’s empty sentence',
      ],
      ['[slEventCalendarError]', 'element', '—', 'content', 'Projected above the grid'],
      [
        'exportAs',
        'slEventCalendar',
        '—',
        'slEventCalendar',
        'focus(), focusDate(date), focusEvent(key), scrollToTime(time), currentView()',
      ],
    ]),
    accessibility: [
      'No Authoring Practices pattern covers a calendar of events. The month and the week are the layout grid of the Grid pattern with the day as its cell: one cell holds the tab stop, arrows move the day, Enter goes into the day’s widgets and Escape or F2 comes back out.',
      'Every event is named by its own content and a visually hidden continuation: the whole range, the calendar, the status and whether it repeats. Position and color state nothing the words do not; a multi-day bar is heard as continuing on each day it crosses.',
      'The title is a heading and a polite live region, so paging by key announces the new period; a chosen stretch is announced once through the shared live announcer, and a wait once when its indicator appears.',
      'The title and the list days are role="heading" with aria-level from the level input, because an Angular template cannot choose an element’s tag at run time; the React binding writes h2 to h6. Both expose the same heading to a screen reader.',
      'Every move a pointer makes has a key: with an editable event focused, Alt and the arrows move it a slot or a day, and Alt with Shift moves its end. The request is announced once with the title and the new range, and focus stays on the event where it lands. A destination canDrop refuses is passed over for the next allowed one; with none in reach the event stays and the refusal is announced.',
      'With a context menu template, Shift+F10 and the ContextMenu key open the menu on the focused event, or on the selection or the day of the focused cell; the menu is named by the event’s title or the stretch in words, and closing it returns focus to where it was.',
      'No single-letter shortcut is bound: a calendar lives in a page with shortcuts of its own, and a bare letter in a grid collides with a screen reader’s quick navigation.',
    ],
    snippets: [
      defineSnippet({
        id: 'event-calendar-angular-component',
        language: 'ts',
        label: 'Instants from the server, converted once',
        source: `@Component({
  imports: [SlEventCalendar, SlEventCalendarDetail],
  template: \`<div
    slEventCalendar
    [events]="events()"
    [timeZone]="zone"
    (rangeChange)="range.set($event)"
  ></div>\`,
})
export class TeamCalendar {
  readonly zone = 'America/Sao_Paulo';
  readonly events = computed(() =>
    this.rows().map((row) => ({
      id: row.id,
      title: row.title,
      start: wallClockIn(row.startsAt, this.zone),
      end: wallClockIn(row.endsAt, this.zone),
    })),
  );
}`,
      }),
      defineSnippet({
        id: 'event-calendar-angular-defaults',
        language: 'ts',
        label: 'Defaults once, for the application',
        source: `bootstrapApplication(App, {
  providers: [
    provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
    provideEventCalendarDefaults({ timeZone: 'America/Sao_Paulo' }),
  ],
});`,
      }),
      defineSnippet({
        id: 'event-calendar-theming',
        language: 'css',
        label: 'A taller hour and a quieter grid',
        source: `[data-ui='event-calendar'] {
  --slotted-event-calendar-hour-size: 4.5rem;
  --slotted-event-calendar-rule-color: var(--slotted-surface-sunken);
}`,
      }),
    ],
  },
} as const;
