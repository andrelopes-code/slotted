import { dayOfWeek, plainDate, toISODate, wallClockIn } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Alert, AlertActions, AlertContent, AlertDescription, AlertTitle } from '../alert';
import { Avatar } from '../avatar';
import { Button } from '../button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { MenuItem, MenuSeparator } from '../menu';
import { TextField } from '../text-field';
import { EventCalendar } from './event-calendar';
import { EventCalendarDefaultsProvider } from './event-calendar-defaults';
import {
  applyChange,
  Laptop,
  ON_CALL,
  Phone,
  STUDIO_CALENDARS,
  STUDIO_EVENTS,
  STUDIO_HOURS,
  TODAY,
} from './event-calendar-demo';
import type { StudioEvent } from './event-calendar-demo';
import { REACT_EVENT_CALENDAR_DOCS, REACT_EVENT_CALENDAR_TOKENS } from './event-calendar.docs';
import type {
  EventCalendarHandle,
  EventCalendarProps,
  EventCalendarSelection,
  EventOccurrence,
} from './event-calendar.types';

const STUDIO: Pick<
  EventCalendarProps<StudioEvent>,
  'calendars' | 'defaultDate' | 'events' | 'locale' | 'timeZone'
> = {
  calendars: STUDIO_CALENDARS,
  defaultDate: TODAY,
  events: STUDIO_EVENTS,
  locale: 'en-US',
  timeZone: 'America/Sao_Paulo',
};

const describeSelection = (selection: EventCalendarSelection | null) => {
  if (selection === null) return 'nothing chosen';
  const start = 'time' in selection.start ? selection.start : null;
  if (start !== null && 'time' in selection.end) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${toISODate(start.date)} ${pad(start.time.hour)}:${pad(start.time.minute)}–${pad(
      selection.end.time.hour,
    )}:${pad(selection.end.time.minute)}`;
  }
  return `${toISODate(selection.start as never)} to ${toISODate(selection.end as never)}`;
};

/** What the studio shows in its detail: the owner, the place, the notes and an edit. */
function EventSummary({ occurrence }: { occurrence: EventOccurrence<StudioEvent> }) {
  const { event } = occurrence;
  return (
    <DescriptionList layout="stack">
      {event.owner === undefined ? null : (
        <DescriptionListItem>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription>{event.owner}</DescriptionListDescription>
        </DescriptionListItem>
      )}
      {event.location === undefined ? null : (
        <DescriptionListItem>
          <DescriptionListTerm>Where</DescriptionListTerm>
          <DescriptionListDescription>{event.location}</DescriptionListDescription>
        </DescriptionListItem>
      )}
      <DescriptionListItem>
        <DescriptionListTerm>Calendar</DescriptionListTerm>
        <DescriptionListDescription>
          {STUDIO_CALENDARS.find((entry) => entry.key === event.calendar)?.label ?? '—'}
        </DescriptionListDescription>
      </DescriptionListItem>
      {event.notes === undefined ? null : (
        <DescriptionListItem>
          <DescriptionListTerm>Notes</DescriptionListTerm>
          <DescriptionListDescription>{event.notes}</DescriptionListDescription>
        </DescriptionListItem>
      )}
    </DescriptionList>
  );
}

function PlaygroundCalendar() {
  const [log, setLog] = useState('Nothing asked yet.');
  const [events, setEvents] = useState<StudioEvent[]>(STUDIO_EVENTS);
  return (
    <>
      <EventCalendar<StudioEvent>
        {...STUDIO}
        editable
        events={events}
        onEventChange={(change, request) => {
          setEvents((held) => applyChange(held, change));
          setLog(`${change.kind} ${change.key} (${request.reason})`);
        }}
        actions={
          <Button size="md" tone="accent">
            New event
          </Button>
        }
        onDateChange={(date, request) => setLog(`date → ${toISODate(date)} (${request.reason})`)}
        onOpenEventChange={(key, request) => setLog(`open → ${key ?? 'none'} (${request.reason})`)}
        onSelectionChange={(selection, request) =>
          setLog(`selection → ${describeSelection(selection)} (${request.reason})`)
        }
        onViewChange={(view, request) => setLog(`view → ${view} (${request.reason})`)}
        renderEventDetail={(occurrence) => <EventSummary occurrence={occurrence} />}
        selectionMode="range"
        workingHours={STUDIO_HOURS}
      />
      <p className="slotted-demo-scene__note">{log}</p>
    </>
  );
}

function EditingCalendar({ view }: { view: 'week' | 'month' }) {
  const [events, setEvents] = useState<StudioEvent[]>(STUDIO_EVENTS);
  const [log, setLog] = useState(
    'Drag an event, pull its end, or focus it and press Alt with the arrows. The studio is closed at weekends.',
  );
  return (
    <>
      <EventCalendar<StudioEvent>
        {...STUDIO}
        defaultView={view}
        editable={(occurrence) => occurrence.event.status !== 'cancelled'}
        canDrop={(change) =>
          dayOfWeek('date' in change.start ? change.start.date : change.start) % 6 !== 0
        }
        events={events}
        workingHours={STUDIO_HOURS}
        onEventChange={(change, request) => {
          setEvents((held) => applyChange(held, change));
          setLog(
            `${change.kind === 'move' ? 'Moved' : 'Resized'} ${change.event.title}${
              change.recurring ? ' (this occurrence only)' : ''
            } — ${request.reason}`,
          );
        }}
      />
      <p className="slotted-demo-scene__note">{log}</p>
    </>
  );
}

function CalendarsCalendar() {
  const [visible, setVisible] = useState<readonly string[]>(['product', 'clients', 'travel']);
  const [query, setQuery] = useState('');
  return (
    <>
      <EventCalendar<StudioEvent>
        {...STUDIO}
        actions={
          <TextField
            aria-label="Search events"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events"
            size="sm"
            type="search"
            value={query}
          />
        }
        filter={(occurrence) => occurrence.event.title.toLowerCase().includes(query.toLowerCase())}
        onVisibleCalendarsChange={setVisible}
        visibleCalendars={visible}
      />
      <p className="slotted-demo-scene__note">Showing {visible.join(', ')}.</p>
    </>
  );
}

function SelectionCalendar() {
  const [selection, setSelection] = useState<EventCalendarSelection | null>(null);
  return (
    <>
      <EventCalendar<StudioEvent>
        {...STUDIO}
        defaultView="week"
        onSelectionChange={setSelection}
        selection={selection}
        selectionMode="range"
        workingHours={STUDIO_HOURS}
      />
      <p className="slotted-demo-scene__note">
        {selection === null
          ? 'Drag across empty hours, or press Space on a day.'
          : `New event: ${describeSelection(selection)}`}
        {selection === null ? null : (
          <>
            {' '}
            <Button onClick={() => setSelection(null)} size="sm" tone="secondary" variant="ghost">
              Clear
            </Button>
          </>
        )}
      </p>
    </>
  );
}

/**
 * Commands per target, run on the demo's own events: open, duplicate and
 * delete an event; create one on an hour, a day or the selection.
 */
function ContextMenuCalendar() {
  const [events, setEvents] = useState<StudioEvent[]>(STUDIO_EVENTS);
  const [said, setSaid] = useState<string | null>(null);
  const made = useRef(0);
  return (
    <>
      <EventCalendar<StudioEvent>
        {...STUDIO}
        defaultView="week"
        events={events}
        renderContextMenu={(target) => {
          if (target.kind === 'slot') {
            const { slot } = target;
            return (
              <MenuItem
                onSelect={() => {
                  made.current += 1;
                  setEvents((list) => [
                    ...list,
                    {
                      id: `new-${made.current}`,
                      title: 'New event',
                      start: slot.start,
                      end: slot.end,
                      calendar: 'product',
                    },
                  ]);
                  setSaid(`Created: ${describeSelection(slot)}`);
                }}
              >
                New event
              </MenuItem>
            );
          }
          const { occurrence } = target;
          const { event } = occurrence;
          return (
            <>
              <MenuItem onSelect={() => setSaid(`Opened “${event.title}”`)} shortcut="Enter">
                Open
              </MenuItem>
              <MenuItem
                onSelect={() => {
                  made.current += 1;
                  setEvents((list) => [
                    ...list,
                    {
                      ...event,
                      id: `${event.id}-copy-${made.current}`,
                      title: `${event.title} (copy)`,
                      recurrence: undefined,
                      ...(occurrence.allDay
                        ? {}
                        : { start: occurrence.start, end: occurrence.end }),
                    },
                  ]);
                  setSaid(`Duplicated “${event.title}”`);
                }}
              >
                Duplicate
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                onSelect={() => {
                  setEvents((list) => list.filter((entry) => entry.id !== event.id));
                  setSaid(`Deleted “${event.title}”`);
                }}
                tone="danger"
              >
                {occurrence.recurring ? 'Delete series' : 'Delete'}
              </MenuItem>
            </>
          );
        }}
        selectionMode="range"
        workingHours={STUDIO_HOURS}
      />
      <p className="slotted-demo-scene__note">
        {said ??
          'Right-click an event, an hour or a selection; on touch, hold; from the keyboard, Shift+F10.'}
      </p>
    </>
  );
}

function KeyboardCalendar() {
  const calendar = useRef<EventCalendarHandle>(null);
  return (
    <>
      <div className="slotted-demo-row">
        <Button
          onClick={() => calendar.current?.focusDate(plainDate(2026, 10, 1))}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Focus 1 October
        </Button>
        <Button
          onClick={() => calendar.current?.focusEvent('standup@2026-09-24')}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Focus today’s standup
        </Button>
      </div>
      <EventCalendar<StudioEvent> {...STUDIO} ref={calendar} />
    </>
  );
}

/** Instants as a server sends them, converted once for the zone the reader is in. */
const NEW_YORK_ROWS = [
  {
    id: 'shift',
    title: 'Night support shift',
    startsAt: Date.UTC(2026, 10, 1, 4, 30),
    endsAt: Date.UTC(2026, 10, 1, 8, 30),
  },
  {
    id: 'handoff-1',
    title: 'On-call handoff, first 1:30',
    startsAt: Date.UTC(2026, 10, 1, 5, 30),
    endsAt: Date.UTC(2026, 10, 1, 6, 0),
  },
  {
    id: 'handoff-2',
    title: 'On-call handoff, second 1:30',
    startsAt: Date.UTC(2026, 10, 1, 6, 30),
    endsAt: Date.UTC(2026, 10, 1, 7, 0),
  },
  {
    id: 'backups',
    title: 'Backups',
    startsAt: Date.UTC(2026, 10, 1, 10, 0),
    endsAt: Date.UTC(2026, 10, 1, 11, 0),
  },
];
const NEW_YORK_EVENTS = NEW_YORK_ROWS.map((row) => ({
  id: row.id,
  title: row.title,
  calendar: 'product',
  start: wallClockIn(row.startsAt, 'America/New_York'),
  end: wallClockIn(row.endsAt, 'America/New_York'),
}));

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_EVENT_CALENDAR_DOCS.eventCalendar.scenes, {
    playground: Playground,
    views: Views,
    month: Month,
    week: Week,
    day: Day,
    list: List,
    'all-day': AllDay,
    overlap: Overlap,
    recurrence: Recurrence,
    'time-zone': TimeZone,
    calendars: Calendars,
    'working-hours': WorkingHours,
    'day-content': DayContent,
    detail: Detail,
    'context-menu': ContextMenu,
    selection: Selection,
    editing: Editing,
    loading: Loading,
    empty: Empty,
    error: ErrorState,
    compact: Compact,
    'custom-event': CustomEvent,
    locale: Locale,
    density: Density,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/EventCalendar',
  args: { events: STUDIO_EVENTS } as never,
  component: EventCalendar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Event Calendar',
        description:
          'Dated events in four views — month, week, day and list — over wall-clock values: the family expands recurrence, lays overlapping events out in columns, marks today, now and the day a zone changes its clocks, and asks with a reason to move the date, the view, the calendars in view, the chosen stretch and the open event. Below 600 pixels the month and the week read as a list.',
        framework: 'React',
        ...REACT_EVENT_CALENDAR_DOCS.eventCalendar,
        tokens: REACT_EVENT_CALENDAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof EventCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => <PlaygroundCalendar />,
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => (
    <Grid columns={1}>
      <Scene label="A planner" note="Week first, then day and month; no list.">
        <EventCalendar<StudioEvent> {...STUDIO} views={['week', 'day', 'month']} />
      </Scene>
      <Scene label="An agenda" note="One view, so no switcher is drawn at all.">
        <EventCalendar<StudioEvent> {...STUDIO} views={['list']} />
      </Scene>
    </Grid>
  ),
};

export const Month: Story = {
  parameters: scenario('month'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultOpenEvent="planning@2026-09-21"
      defaultSelection={{ start: plainDate(2026, 9, 29), end: plainDate(2026, 9, 30) }}
      selectionMode="range"
      weekNumbers
      workingHours={STUDIO_HOURS}
    />
  ),
};

export const Week: Story = {
  parameters: scenario('week'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      dayHours={[8, 20]}
      defaultView="week"
      weekends="hidden"
    />
  ),
};

export const Day: Story = {
  parameters: scenario('day'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultDate={plainDate(2026, 9, 23)}
      defaultView="day"
      slotDuration={15}
    />
  ),
};

export const List: Story = {
  parameters: scenario('list'),
  render: () => <EventCalendar<StudioEvent> {...STUDIO} defaultView="list" listRange="month" />,
};

export const AllDay: Story = {
  parameters: scenario('all-day'),
  render: () => (
    <Grid columns={1}>
      <Scene label="The release week" note="The release crosses midnight: one block on each day.">
        <EventCalendar<StudioEvent>
          {...STUDIO}
          defaultDate={plainDate(2026, 9, 17)}
          defaultView="week"
        />
      </Scene>
      <Scene
        label="The same events in the month"
        note="A conference, a trip across a weekend, a leave across two weeks."
      >
        <EventCalendar<StudioEvent> {...STUDIO} defaultDate={plainDate(2026, 10, 1)} />
      </Scene>
    </Grid>
  ),
};

export const Overlap: Story = {
  parameters: scenario('overlap'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="maxColumns 3"
        note="Wednesday’s four meetings share three columns; Thursday’s five panels draw two and a +3."
      >
        <EventCalendar<StudioEvent>
          {...STUDIO}
          defaultView="week"
          scrollTime={{ hour: 10, minute: 30, second: 0 }}
        />
      </Scene>
      <Scene label="maxColumns 5" note="With room for all five, none folds.">
        <EventCalendar<StudioEvent>
          {...STUDIO}
          defaultView="day"
          maxColumns={5}
          scrollTime={{ hour: 10, minute: 30, second: 0 }}
        />
      </Scene>
    </Grid>
  ),
};

export const Recurrence: Story = {
  parameters: scenario('recurrence'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultDate={plainDate(2026, 9, 21)}
      defaultView="week"
    />
  ),
};

export const TimeZone: Story = {
  parameters: scenario('time-zone'),
  render: () => (
    <Grid columns={1}>
      {/* language: pt-BR */}
      <Scene label="São Paulo" note="GMT-3 in the gutter; the now line is São Paulo’s now.">
        {/* language: en-US */}
        <EventCalendar<StudioEvent> {...STUDIO} defaultView="day" />
      </Scene>
      <Scene
        label="New York, 1 November"
        note="The clocks go back at 2 AM; both handoffs at 1:30 share the hour that repeats."
      >
        <EventCalendar
          calendars={STUDIO_CALENDARS}
          dayHours={[0, 12]}
          defaultDate={plainDate(2026, 11, 1)}
          defaultView="day"
          events={NEW_YORK_EVENTS}
          locale="en-US"
          scrollTime={{ hour: 0, minute: 0, second: 0 }}
          timeZone="America/New_York"
        />
      </Scene>
    </Grid>
  ),
};

export const Calendars: Story = {
  parameters: scenario('calendars'),
  render: () => <CalendarsCalendar />,
};

export const WorkingHours: Story = {
  parameters: scenario('working-hours'),
  render: () => (
    <EventCalendar<StudioEvent> {...STUDIO} defaultView="week" workingHours={STUDIO_HOURS} />
  ),
};

export const DayContent: Story = {
  parameters: scenario('day-content'),
  render: () => (
    <Grid columns={1}>
      <Scene label="In the week" note="Under the date, centred with it.">
        <EventCalendar<StudioEvent>
          {...STUDIO}
          defaultView="week"
          renderDayContent={(date) => ON_CALL[toISODate(date)] ?? null}
        />
      </Scene>
      <Scene
        label="In the month"
        note="At the end of the header line, truncated before the number is."
      >
        <EventCalendar<StudioEvent>
          {...STUDIO}
          renderDayContent={(date) => ON_CALL[toISODate(date)] ?? null}
        />
      </Scene>
    </Grid>
  ),
};

export const Detail: Story = {
  parameters: scenario('detail'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultView="week"
      renderEventDetail={(occurrence, { close }) => (
        <>
          <EventSummary occurrence={occurrence} />
          <div className="slotted-demo-row">
            <Button onClick={close} size="sm" tone="secondary" variant="outline">
              Edit
            </Button>
          </div>
        </>
      )}
    />
  ),
};

export const ContextMenu: Story = {
  parameters: scenario('context-menu'),
  render: () => <ContextMenuCalendar />,
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => <SelectionCalendar />,
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In the hours"
        note="Minutes snap to the slot; the column under the pointer is the day."
      >
        <EditingCalendar view="week" />
      </Scene>
      <Scene label="In the month" note="Whole days; a bar’s end pulls to make it longer.">
        <EditingCalendar view="month" />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => <EventCalendar<StudioEvent> {...STUDIO} events={[]} loading loadingDelay={0} />,
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultDate={plainDate(2026, 12, 30)}
      defaultView="list"
      empty={
        <Button size="sm" tone="accent">
          New event
        </Button>
      }
      events={[]}
    />
  ),
};

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      error={
        <Alert tone="danger" variant="soft">
          <AlertContent>
            <AlertTitle>The events for October could not be loaded.</AlertTitle>
            <AlertDescription>
              The calendar service did not answer. The grid still moves between months.
            </AlertDescription>
          </AlertContent>
          <AlertActions>
            <Button size="sm" tone="danger">
              Try again
            </Button>
          </AlertActions>
        </Alert>
      }
      events={[]}
    />
  ),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="compact list (default)"
        note="The month reads as the month’s list; an event opens its detail as a sheet from the bottom."
      >
        <Phone>
          <EventCalendar<StudioEvent>
            {...STUDIO}
            listRange="month"
            renderEventDetail={(occurrence) => <EventSummary occurrence={occurrence} />}
          />
        </Phone>
      </Scene>
      <Scene
        label="compact keep"
        note="The grid stays: marks of colour; a day opens its events as a sheet from the bottom."
      >
        <Phone>
          <EventCalendar<StudioEvent>
            {...STUDIO}
            compact="keep"
            renderEventDetail={(occurrence) => <EventSummary occurrence={occurrence} />}
          />
        </Phone>
      </Scene>
    </Grid>
  ),
};

export const CustomEvent: Story = {
  parameters: scenario('custom-event'),
  render: () => (
    <EventCalendar<StudioEvent>
      {...STUDIO}
      defaultDate={plainDate(2026, 9, 16)}
      defaultView="day"
      renderEvent={(occurrence, { content, layout }) =>
        layout === 'block' && occurrence.event.owner !== undefined ? (
          <>
            {content}
            <Avatar name={occurrence.event.owner} size="xs" />
          </>
        ) : (
          content
        )
      }
      scrollTime={{ hour: 12, minute: 0, second: 0 }}
    />
  ),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="pt-BR"
        note="Sunday first, a 24-hour clock, and every word from the Portuguese catalog; messages renames the calendar menu for this studio."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <EventCalendarDefaultsProvider timeZone="America/Sao_Paulo">
            <EventCalendar<StudioEvent>
              calendars={STUDIO_CALENDARS}
              defaultDate={TODAY}
              defaultView="week"
              events={STUDIO_EVENTS}
              messages={{ calendars: 'Agendas' }}
            />
          </EventCalendarDefaultsProvider>
        </SlottedProvider>
      </Scene>
      <Scene
        label="he, right to left"
        note="The grid, the chevrons and the bars mirror; English titles keep their own direction."
      >
        <div dir="rtl">
          <EventCalendar<StudioEvent> {...STUDIO} locale="he" />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => (
    <Laptop>
      <div data-slotted-density="dense">
        <EventCalendar<StudioEvent> {...STUDIO} defaultView="week" />
      </div>
    </Laptop>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => <KeyboardCalendar />,
};
