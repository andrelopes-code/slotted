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

export const REACT_EVENT_CALENDAR_TOKENS = eventCalendarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned EventCalendar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { EventCalendar, EventCalendarDefaultsProvider, SlottedProvider } from '@slotted/react';\nimport type { CalendarEvent } from '@slotted/react';\nimport { wallClockIn } from '@slotted/core/date';",
};

/** Shared by both bindings' pages: the parts are the contract's, not a binding's. */
export const EVENT_CALENDAR_ANATOMY: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
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
    element: 'h2 (level)',
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
    element: 'div holding a SegmentedControl',
    required: false,
    purpose: 'The views offered, with more than one.',
  },
  {
    part: 'filter',
    element: 'button, the Menu trigger',
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
    element: 'div holding a ProgressBar',
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
    purpose: 'renderDayContent(date): a price, a count of free slots, who is on call.',
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
    element: 'h3 (level + 1)',
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
    note: 'Every model uncontrolled: switch views, page, filter the calendars, press an event to open its detail and drag across empty hours to choose a stretch. The line under it says what the calendar asked for.',
    snippet: defineSnippet({
      id: 'event-calendar-react-playground',
      language: 'tsx',
      label: 'Events in, requests out',
      source: `<EventCalendar
  calendars={calendars}
  events={events}
  onRangeChange={fetchRange}
  renderEventDetail={(occurrence) => <EventSummary occurrence={occurrence} />}
  selectionMode="range"
  timeZone="America/Sao_Paulo"
/>;`,
    }),
  },
  {
    id: 'views',
    title: 'Which views, in what order',
    note: 'views sets the switcher and its order; the first is the one an uncontrolled calendar opens on. A booking page that only lists and a planner without a list are the same family.',
    snippet: defineSnippet({
      id: 'event-calendar-react-views',
      language: 'tsx',
      label: 'A planner with three views',
      source: `<EventCalendar events={events} views={['week', 'day', 'month']} />;`,
    }),
  },
  {
    id: 'month',
    title: 'The month',
    note: 'All-day and multi-day events are bars; a meeting of one day is a dot, a time and a title. A bar running into next week stops in its cell with a chevron; the week number, the outside days and the continuous run of chosen days all show here.',
    snippet: defineSnippet({
      id: 'event-calendar-react-month',
      language: 'tsx',
      label: 'Week numbers and a fixed six-row grid',
      source: `<EventCalendar defaultView="month" events={events} fixedWeeks weekNumbers />;`,
    }),
  },
  {
    id: 'week',
    title: 'The week',
    note: 'Blocks stand off the rules and off each other. The all-day lane holds bars across days, today’s column carries the now line, and the hours open on scrollTime. Hide the weekend for a working week.',
    snippet: defineSnippet({
      id: 'event-calendar-react-week',
      language: 'tsx',
      label: 'A working week from eight to eight',
      source: `<EventCalendar dayHours={[8, 20]} defaultView="week" events={events} weekends="hidden" />;`,
    }),
  },
  {
    id: 'day',
    title: 'The day',
    note: 'One column with room for the location under each title. The previous and next buttons step one day, and skip Saturday and Sunday when the weekend is hidden.',
    snippet: defineSnippet({
      id: 'event-calendar-react-day',
      language: 'tsx',
      label: 'Quarter-hour slots',
      source: `<EventCalendar defaultView="day" events={events} slotDuration={15} />;`,
    }),
  },
  {
    id: 'list',
    title: 'The list',
    note: 'A heading per day that holds an event and nothing for the days that hold none. Every event is in the tab order; the time has a column of its own so the titles align down the page.',
    snippet: defineSnippet({
      id: 'event-calendar-react-list',
      language: 'tsx',
      label: 'A month as an agenda',
      source: `<EventCalendar defaultView="list" events={events} listRange="month" />;`,
    }),
  },
  {
    id: 'all-day',
    title: 'All-day, multi-day and past midnight',
    note: 'A start without a time is a whole day, and its end is the last day, inclusive. The release window runs from 10 PM to 2 AM: one block per day in the week, one bar in the month labelled with its start.',
    snippet: defineSnippet({
      id: 'event-calendar-react-all-day',
      language: 'tsx',
      label: 'The kind of start decides',
      source: `const events: CalendarEvent[] = [
  {
    id: 'conference',
    title: 'Conference',
    start: plainDate(2026, 9, 8),
    end: plainDate(2026, 9, 10),
  },
  { id: 'release', title: 'Release window', start: at(17, 22), end: at(18, 2) },
];`,
    }),
  },
  {
    id: 'overlap',
    title: 'Overlapping events',
    note: 'Events that overlap share the day in columns, each spanning the free columns to its right; no text is covered. Five hiring panels at the same hour draw two columns and a +3 that opens the day.',
    snippet: defineSnippet({
      id: 'event-calendar-react-overlap',
      language: 'tsx',
      label: 'How many columns before +N',
      source: `<EventCalendar defaultView="week" events={events} maxColumns={4} />;`,
    }),
  },
  {
    id: 'recurrence',
    title: 'Recurrence, exceptions and a moved occurrence',
    note: 'The standup repeats every weekday and skips Labor Day; planning repeats every other Monday, and the one on the 21st was moved to Tuesday afternoon. A rule outside the subset degrades to a single occurrence.',
    snippet: defineSnippet({
      id: 'event-calendar-react-recurrence',
      language: 'tsx',
      label: 'RRULE text or a rule object, EXDATE and RECURRENCE-ID',
      source: `const events: CalendarEvent[] = [
  {
    id: 'standup',
    title: 'Standup',
    start: at(1, 9, 30),
    end: at(1, 9, 45),
    recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    exceptions: [plainDate(2026, 9, 7)],
  },
  {
    id: 'moved',
    title: 'Planning (moved)',
    start: at(22, 14),
    end: at(22, 15),
    recurrenceOf: 'planning',
    occurrence: plainDate(2026, 9, 21),
  },
];`,
    }),
  },
  {
    id: 'time-zone',
    title: 'Time zones and the day the clocks change',
    note: 'The calendar draws wall-clock time. The application converts its instants once with wallClockIn; timeZone decides today, the now line and the gutter’s label. On 1 November in New York the header says the clocks go back at 2 AM and the column marks the minute.',
    snippet: defineSnippet({
      id: 'event-calendar-react-time-zone',
      language: 'tsx',
      label: 'Instants from the server, wall-clock on screen',
      source: `const events = rows.map((row) => ({
  id: row.id,
  title: row.title,
  start: wallClockIn(row.startsAt, zone),
  end: wallClockIn(row.endsAt, zone),
}));

<EventCalendar events={events} timeZone={zone} />;`,
    }),
  },
  {
    id: 'calendars',
    title: 'Calendars and their colours',
    note: 'Each calendar takes a slot of the data palette in order and never cycles. The filter is a menu of checkboxes; a predicate composes a search on top. Colour is identity only: the calendar is also in every event’s name.',
    snippet: defineSnippet({
      id: 'event-calendar-react-calendars',
      language: 'tsx',
      label: 'Controlled visibility and a search',
      source: `<EventCalendar
  actions={<TextField aria-label="Search events" onChange={search} size="sm" type="search" />}
  calendars={calendars}
  events={events}
  filter={(occurrence) => occurrence.event.title.toLowerCase().includes(query)}
  onVisibleCalendarsChange={setVisible}
  visibleCalendars={visible}
/>;`,
    }),
  },
  {
    id: 'working-hours',
    title: 'Working hours',
    note: 'The hours outside workingHours are shaded, and a day no entry names is shaded whole. Shading informs and does not refuse: whether a slot outside hours can be booked is the application’s rule.',
    snippet: defineSnippet({
      id: 'event-calendar-react-working-hours',
      language: 'tsx',
      label: 'A clinic open in two shifts',
      source: `<EventCalendar
  events={appointments}
  workingHours={[
    {
      days: [1, 2, 3, 4, 5],
      start: { hour: 8, minute: 0, second: 0 },
      end: { hour: 12, minute: 0, second: 0 },
    },
    {
      days: [1, 2, 3, 4, 5],
      start: { hour: 14, minute: 0, second: 0 },
      end: { hour: 19, minute: 0, second: 0 },
    },
  ]}
/>;`,
    }),
  },
  {
    id: 'day-content',
    title: 'What a domain writes on a day',
    note: 'renderDayContent writes into every day header: who is on call here, a nightly price on a booking page, free slots in a clinic. It sits at the end of the header line in the month and under the date in the week.',
    snippet: defineSnippet({
      id: 'event-calendar-react-day-content',
      language: 'tsx',
      label: 'One node per day',
      source: `<EventCalendar events={events} renderDayContent={(date) => onCall[toISODate(date)] ?? null} />;`,
    }),
  },
  {
    id: 'detail',
    title: 'Opening an event',
    note: 'With renderEventDetail the family opens a popover anchored to the event and gives it back focus on close. Without it, onOpenEventChange asks and the application opens its own drawer; the open event keeps aria-expanded either way.',
    snippet: defineSnippet({
      id: 'event-calendar-react-detail',
      language: 'tsx',
      label: 'A detail the family hosts',
      source: `<EventCalendar
  events={events}
  renderEventDetail={(occurrence, { close }) => (
    <EventSummary
      occurrence={occurrence}
      onEdit={() => edit(occurrence.event.id)}
      onClose={close}
    />
  )}
/>;`,
    }),
  },
  {
    id: 'context-menu',
    title: 'Commands on a right click',
    note: 'With renderContextMenu a secondary click, a long press or Shift+F10 opens the context-menu family on what was pointed at: an event, the selection when the pointer is inside it, one step of the hours, or a day. The event is drawn solid and a stretch as the selection being made; returning nothing keeps the browser’s own menu.',
    snippet: defineSnippet({
      id: 'event-calendar-react-context-menu',
      language: 'tsx',
      label: 'Items per target',
      source: `<EventCalendar
  events={events}
  renderContextMenu={(target) =>
    target.kind === 'event' ? (
      <>
        <MenuItem onSelect={() => duplicate(target.occurrence)}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => remove(target.occurrence)} tone="danger">
          Delete
        </MenuItem>
      </>
    ) : (
      <MenuItem onSelect={() => openCreateDialog(target.slot)}>New event</MenuItem>
    )
  }
/>;`,
    }),
  },
  {
    id: 'selection',
    title: 'Choosing a stretch to create an event',
    note: 'Drag across empty hours or days, or press Space on a day and extend with Shift and the arrows. The calendar asks with the stretch and a reason; the application opens its form and clears the selection when done.',
    snippet: defineSnippet({
      id: 'event-calendar-react-selection',
      language: 'tsx',
      label: 'The selection is a request to create',
      source: `<EventCalendar
  events={events}
  onSelectionChange={(next) => {
    setSelection(next);
    if (next !== null) openCreateDialog(next);
  }}
  selection={selection}
  selectionMode="range"
/>;`,
    }),
  },
  {
    id: 'editing',
    title: 'Moving and resizing',
    note: 'With editable, a press that travels four pixels picks an event up and lays it out where it would land; its end pulls to resize. Release asks with onEventChange; Escape puts it back. Alt with the arrows does the same from the keyboard. A series asks with the occurrence’s own date. canDrop is asked about every destination with the same change: a refused one is drawn with a dashed danger edge, letting go there asks nothing, and Alt with an arrow passes over it to the next allowed one.',
    snippet: defineSnippet({
      id: 'event-calendar-react-editing',
      language: 'tsx',
      label: 'The application writes the move back',
      source: `<EventCalendar
  canDrop={(change) =>
    dayOfWeek('date' in change.start ? change.start.date : change.start) % 6 !== 0
  }
  editable
  events={events}
  onEventChange={(change) =>
    setEvents((held) =>
      held.map((event) =>
        event.id === change.event.id ? { ...event, start: change.start, end: change.end } : event,
      ),
    )
  }
/>;`,
    }),
  },
  {
    id: 'loading',
    title: 'Loading a new range',
    note: 'The grid is structure the date decides, so it stays painted; one bar on its top edge says events are coming, after loadingDelay, and holds for loadingMinDuration. Events already drawn stay until the new ones arrive.',
    snippet: defineSnippet({
      id: 'event-calendar-react-loading',
      language: 'tsx',
      label: 'One prop for the wait',
      source: `<EventCalendar events={data ?? []} loading={isFetching} onRangeChange={setRange} />;`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing this week',
    note: 'The list says so in a sentence and carries the application’s next step. The grid needs no sentence: an empty month is visibly empty.',
    snippet: defineSnippet({
      id: 'event-calendar-react-empty',
      language: 'tsx',
      label: 'The action that creates the first one',
      source: `<EventCalendar
  defaultView="list"
  empty={<Button onClick={create}>New event</Button>}
  events={[]}
/>;`,
    }),
  },
  {
    id: 'error',
    title: 'A range that failed',
    note: 'The error sits above the grid with the application’s retry; paging, the views and the filter keep working, because the failure is the data’s, not the calendar’s.',
    snippet: defineSnippet({
      id: 'event-calendar-react-error',
      language: 'tsx',
      label: 'An Alert with a retry',
      source: `<EventCalendar
  error={
    failed ? <Alert tone="danger" title="The events could not be loaded." action={retry} /> : null
  }
  events={events}
/>;`,
    }),
  },
  {
    id: 'compact',
    title: 'On a phone',
    note: 'Below 600 pixels the month and the week draw as a list of the same days and the view does not change. With compact="keep" the grid stays: events become marks of colour, the day is the target, and each keeps its name. At that width the “+N” panel and the detail are sheets from the bottom edge rather than popovers.',
    snippet: defineSnippet({
      id: 'event-calendar-react-compact',
      language: 'tsx',
      label: 'Keep the grid on a phone',
      source: `<EventCalendar compact="keep" events={events} />;`,
    }),
  },
  {
    id: 'custom-event',
    title: 'Drawing the inside of an event',
    note: 'renderEvent replaces what an event shows and keeps the element, its name, its focus and its geometry. The context says where it is drawn — lane, bar, block or list — and hands the default content to add to.',
    snippet: defineSnippet({
      id: 'event-calendar-react-custom-event',
      language: 'tsx',
      label: 'An owner’s initials in a block',
      source: `<EventCalendar
  events={events}
  renderEvent={(occurrence, { layout, content }) =>
    layout === 'block' ? (
      <>
        {content}
        <Avatar name={occurrence.event.owner} size="xs" />
      </>
    ) : (
      content
    )
  }
/>;`,
    }),
  },
  {
    id: 'locale',
    title: 'Locale, clock and direction',
    note: 'Portuguese starts the week on Sunday, writes a 24-hour clock and takes every word from the catalog of the language in force; Hebrew mirrors the grid, the chevrons and the bars, and an English title on a Hebrew page keeps its own direction.',
    snippet: defineSnippet({
      id: 'event-calendar-react-locale',
      language: 'tsx',
      label: 'Every word replaceable',
      source: `<SlottedProvider locale="pt-BR">
  <EventCalendarDefaultsProvider timeZone="America/Sao_Paulo">
    <EventCalendar events={events} messages={{ calendars: 'Agendas' }} />
  </EventCalendarDefaultsProvider>
</SlottedProvider>;`,
    }),
  },
  {
    id: 'density',
    title: 'Density',
    note: 'An hour is two small controls tall — 60, 52 and 48 pixels — and a lane is the inside of one, so dense shrinks the grid the way it shrinks the controls around it. Switch the toolbar to compare.',
    snippet: defineSnippet({
      id: 'event-calendar-react-density',
      language: 'tsx',
      label: 'The hour is a theme decision',
      source: `<div data-slotted-density="dense">
  <EventCalendar defaultView="week" events={events} />
</div>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches one day. Arrows move the day, Page Up and Down the period, Home and End the week; in the week Up and Down move between the header, all-day and hours rows. Enter goes into a day, Up and Down walk its events, Escape comes back.',
    snippet: defineSnippet({
      id: 'event-calendar-react-keyboard',
      language: 'tsx',
      label: 'Focus a date or an event from outside',
      source: `const calendar = useRef<EventCalendarHandle>(null);

calendar.current?.focusDate(plainDate(2026, 10, 1));
calendar.current?.focusEvent('standup@2026-09-24');`,
    }),
  },
];

export const EVENT_CALENDAR_EVENTS: EventRow[] = [
  {
    name: 'onDateChange',
    payload: '(date: PlainDate, request: ChangeRequest<PlainDate>)',
    when: 'Before the day moves: Previous, Next, Today, a day number (pointer, keyboard), an arrow or Page key (keyboard), focusDate (programmatic). cancel() refuses it.',
  },
  {
    name: 'onViewChange',
    payload: '(view, request: ChangeRequest<EventCalendarView>)',
    when: 'Before the view moves: the switcher, or a day number drilling into the day.',
  },
  {
    name: 'onVisibleCalendarsChange',
    payload: '(keys: readonly string[], request)',
    when: 'Before a calendar is shown or hidden from the filter menu (pointer, keyboard).',
  },
  {
    name: 'onSelectionChange',
    payload: '(selection: EventCalendarSelection | null, request)',
    when: 'Before the chosen stretch moves: a drag (pointer), Space or Shift and the arrows (keyboard), Escape (escape). Not emitted for an equal stretch.',
  },
  {
    name: 'onOpenEventChange',
    payload: '(key: string | null, request)',
    when: 'Before an event opens or closes: a press (pointer, keyboard), the close button (dismiss), Escape (escape), a press outside the popover (outsidePress), close() (programmatic).',
  },
  {
    name: 'onEventChange',
    payload: '(change: { key, event, occurrence, recurring, kind, start, end }, request)',
    when: 'Before an event moves or its end does: a drag released (pointer), Alt or Alt+Shift with an arrow (keyboard). start and end are in the kind the event holds. Not a model: the application answers by changing events.',
  },
  {
    name: 'onRangeChange',
    payload: '({ start: PlainDate, end: PlainDate, view })',
    when: 'After the period in view changes, the first render included. A fact to fetch by, not a model.',
  },
];

export const REACT_EVENT_CALENDAR_DOCS = {
  eventCalendar: {
    imports,
    anatomy: EVENT_CALENDAR_ANATOMY,
    scenes,
    events: EVENT_CALENDAR_EVENTS,
    api: apiRows([
      [
        'events',
        'readonly CalendarEvent[]',
        '—',
        'EventCalendar',
        'The consumer’s events; a start without a time is all-day',
      ],
      [
        'calendars',
        'readonly EventCalendarCalendar[]',
        '[]',
        'EventCalendar',
        'Key, label and an optional colour slot 1–8',
      ],
      [
        'date',
        'PlainDate',
        '—',
        'EventCalendar',
        'The day the calendar is on; present means controlled',
      ],
      [
        'defaultDate',
        'PlainDate',
        'today in timeZone',
        'EventCalendar',
        'Read once; pass it when rendering on a server',
      ],
      [
        'now',
        'PlainDateTime',
        'the clock in timeZone, ticked each minute',
        'EventCalendar',
        'Present means the consumer owns it: the clock is no longer read, and today and the now line follow it. A page dated by its content passes it.',
      ],
      [
        'view',
        "'month' | 'week' | 'day' | 'list'",
        'month',
        'EventCalendar',
        'Present means controlled; uncontrolled opens on the first of views',
      ],
      ['defaultView', 'EventCalendarView', 'views[0]', 'EventCalendar', 'Read once'],
      [
        'views',
        'readonly EventCalendarView[]',
        'month,week,day,list',
        'EventCalendar',
        'The switcher, in order',
      ],
      [
        'visibleCalendars',
        'readonly string[]',
        '—',
        'EventCalendar',
        'Keys drawn; present means controlled',
      ],
      [
        'defaultVisibleCalendars',
        'readonly string[]',
        'every calendar',
        'EventCalendar',
        'Read once',
      ],
      [
        'selectionMode',
        "'none' | 'range'",
        'none',
        'EventCalendar',
        'Whether empty time can be chosen',
      ],
      [
        'selection',
        'EventCalendarSelection | null',
        '—',
        'EventCalendar',
        'The chosen stretch; present means controlled',
      ],
      ['defaultSelection', 'EventCalendarSelection | null', 'null', 'EventCalendar', 'Read once'],
      [
        'openEvent',
        'string | null',
        '—',
        'EventCalendar',
        'The open occurrence’s key; present means controlled',
      ],
      ['defaultOpenEvent', 'string | null', 'null', 'EventCalendar', 'Read once'],
      [
        'renderEventDetail',
        '(occurrence, { close }) => ReactNode',
        '—',
        'EventCalendar',
        'Given, the family hosts the detail popover',
      ],
      [
        'renderContextMenu',
        '(target) => ReactNode',
        '—',
        'EventCalendar',
        'Given, the body is a context-menu target; target is { kind: "event", occurrence } or { kind: "slot", slot }; nothing returned keeps the browser’s menu',
      ],
      [
        'renderEvent',
        '(occurrence, { layout, date, content }) => ReactNode',
        '—',
        'EventCalendar',
        'Replaces an event’s content, not its element',
      ],
      [
        'renderDayContent',
        '(date, { view }) => ReactNode',
        '—',
        'EventCalendar',
        'Writes into every day header',
      ],
      ['filter', '(occurrence) => boolean', '—', 'EventCalendar', 'Keeps an occurrence when true'],
      [
        'editable',
        'boolean | (occurrence) => boolean',
        'false',
        'EventCalendar',
        'Events move and resize, by dragging or by Alt and the arrows',
      ],
      [
        'canDrop',
        '(change) => boolean',
        '—',
        'EventCalendar',
        'Whether a destination is allowed, asked with the change onEventChange would receive',
      ],
      [
        'workingHours',
        'readonly WorkingHours[]',
        '[]',
        'EventCalendar',
        'Shades the time outside them',
      ],
      ['actions', 'ReactNode', '—', 'EventCalendar', 'At the end of the header'],
      [
        'header',
        'boolean',
        'true',
        'EventCalendar',
        'false draws none, for a calendar driven from outside',
      ],
      ['empty', 'ReactNode', '—', 'EventCalendar', 'After the list’s empty sentence'],
      ['error', 'ReactNode', '—', 'EventCalendar', 'Above the grid'],
      ['loading', 'boolean', 'false', 'EventCalendar', 'Events are coming; the grid stays'],
      [
        'loadingDelay',
        'number',
        '200',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Milliseconds before the indicator shows',
      ],
      [
        'loadingMinDuration',
        'number',
        '400',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Milliseconds it holds once shown',
      ],
      [
        'level',
        '2 | 3 | 4 | 5',
        '2',
        'EventCalendar',
        'The title’s heading level; list days are one below',
      ],
      [
        'compact',
        "'list' | 'keep'",
        'list',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Month and week below 600 pixels',
      ],
      [
        'dayHours',
        'readonly [number, number]',
        '0,24',
        'EventCalendar, EventCalendarDefaultsProvider',
        'The first visible hour and the hour the grid stops at',
      ],
      [
        'scrollTime',
        'PlainTime',
        '07:00',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Where the hours open',
      ],
      [
        'slotDuration',
        'number',
        '30',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Minutes between rules, 5 to 120, and the step of a selection, a drag and Alt with an arrow',
      ],
      [
        'maxEvents',
        'number',
        '3',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Lanes a month day draws before +N',
      ],
      [
        'maxColumns',
        'number',
        '6',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Columns a cluster takes before +N, never more than fit at 56 pixels each',
      ],
      [
        'weekends',
        "'shown' | 'hidden'",
        'shown',
        'EventCalendar, EventCalendarDefaultsProvider',
        'A working week',
      ],
      [
        'weekNumbers',
        'boolean',
        'false',
        'EventCalendar, EventCalendarDefaultsProvider',
        'ISO week numbers in the month',
      ],
      [
        'fixedWeeks',
        'boolean',
        'false',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Six rows in every month',
      ],
      [
        'listRange',
        "'week' | 'month'",
        'week',
        'EventCalendar, EventCalendarDefaultsProvider',
        'The period of the list view',
      ],
      [
        'locale',
        'string',
        'SlottedProvider',
        'EventCalendar',
        'BCP 47; decides the first day and the clock. Unset, the language in force decides',
      ],
      [
        'timeZone',
        'string',
        'runtime',
        'EventCalendar, EventCalendarDefaultsProvider',
        'Today, now and the gutter’s label',
      ],
      [
        'firstDayOfWeek',
        'number',
        'locale',
        'EventCalendar, EventCalendarDefaultsProvider',
        '0 is Sunday',
      ],
      [
        'hourCycle',
        "'h12' | 'h23'",
        'locale',
        'EventCalendar, EventCalendarDefaultsProvider',
        'The clock',
      ],
      [
        'messages',
        'Partial<EventCalendarMessages>',
        '—',
        'EventCalendar',
        'Words laid over the language in force, key by key; a group (previous, next, view, empty) is laid over entry by entry',
      ],
      [
        'render',
        '(props: EventCalendarRootProps) => ReactNode',
        '—',
        'EventCalendar',
        'Substitutes the root element',
      ],
      [
        'ref',
        'Ref<EventCalendarHandle>',
        '—',
        'EventCalendar',
        'element, focus(), focusDate(date), focusEvent(key), scrollToTime(time)',
      ],
      [
        'native props',
        'ComponentPropsWithoutRef<"div">',
        '—',
        'EventCalendar',
        'id, className, data-*, aria-* and handlers reach the root; onKeyDown and onPointerDown run after the family’s own',
      ],
    ]),
    accessibility: [
      'No Authoring Practices pattern covers a calendar of events. The month and the week are the layout grid of the Grid pattern with the day as its cell: one cell holds the tab stop, arrows move the day, Enter goes into the day’s widgets and Escape or F2 comes back out, which is the pattern’s own answer for a cell holding several widgets.',
      'Every event is named by its own content — its time, its title — and a visually hidden continuation of the whole range, its calendar, its status and whether it repeats. Position and colour state nothing the words do not; a multi-day bar is heard as continuing on each day it crosses.',
      'The title is a polite live region, so paging by key announces the new period; a chosen stretch is announced once through the shared live announcer, and a wait once when its indicator appears.',
      'The list is not a grid: each day is a section named by its heading and every event is in the tab order, because a list read top to bottom has no second axis. Below 600 pixels the month and the week become that list, and the view the reader chose does not change.',
      'Every move a pointer makes has a key: with an editable event focused, Alt and the arrows move it a slot or a day, and Alt with Shift moves its end. The request is announced once with the title and the new range, and focus stays on the event where it lands. A destination canDrop refuses is passed over for the next allowed one; with none in reach the event stays and the refusal is announced.',
      'With renderContextMenu, Shift+F10 and the ContextMenu key open the menu on the focused event, or on the selection or the day of the focused cell; the menu is named by the event’s title or the stretch in words, and closing it returns focus to where it was.',
      'No single-letter shortcut is bound: a calendar lives in a page with shortcuts of its own, and a bare letter in a grid collides with a screen reader’s quick navigation.',
    ],
    snippets: [
      defineSnippet({
        id: 'event-calendar-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="event-calendar" data-part="root" data-view="week" data-layout="grid">
  <div data-part="header">
    <h2 data-part="title" aria-live="polite">
      Sep 20 – 26, 2026
    </h2>
    <div data-part="navigation" role="group">
      …
    </div>
    <div data-part="views">…</div>
    <button data-part="filter">…</button>
  </div>
  <div data-part="body">
    <div data-part="loader">…</div>
    <div data-part="time-grid" role="grid" aria-labelledby="…">
      <div data-part="time-head" role="rowgroup">
        …
      </div>
      <div data-part="scroller" role="rowgroup">
        <div data-part="time-row" role="row">
          <div data-part="gutter" role="rowheader">
            …
          </div>
          <div
            data-part="column"
            data-row="timed"
            data-date="2026-09-24"
            role="gridcell"
            tabindex="0"
          >
            <button data-part="event" data-key="critique" data-color="1">
              <span data-part="event-title">Design critique</span>
              <span data-part="event-time">1:00 – 3:00 PM</span>
              <span data-part="event-meta">, Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;`,
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
