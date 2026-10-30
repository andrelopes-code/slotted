import { Component, input, signal } from '@angular/core';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { dayOfWeek, plainDate, toISODate, wallClockIn } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlEventCalendar } from './event-calendar';
import type {
  EventCalendarEventChange,
  EventCalendarSelection,
  EventOccurrence,
} from './event-calendar-defaults';
import {
  applyChange,
  ON_CALL,
  STUDIO_CALENDARS,
  STUDIO_EVENTS,
  STUDIO_HOURS,
  TODAY,
} from './event-calendar-demo';
import type { StudioEvent } from './event-calendar-demo';
import {
  SlEventCalendarActions,
  SlEventCalendarContextMenu,
  SlEventCalendarDayContent,
  SlEventCalendarDetail,
  SlEventCalendarEmpty,
  SlEventCalendarError,
  SlEventCalendarEvent,
} from './event-calendar-templates';
import { ANGULAR_EVENT_CALENDAR_DOCS, ANGULAR_EVENT_CALENDAR_TOKENS } from './event-calendar.docs';

const describeSelection = (selection: EventCalendarSelection | null) => {
  if (selection === null) return 'nothing chosen';
  if ('time' in selection.start && 'time' in selection.end) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${toISODate(selection.start.date)} ${pad(selection.start.time.hour)}:${pad(
      selection.start.time.minute,
    )}–${pad(selection.end.time.hour)}:${pad(selection.end.time.minute)}`;
  }
  return `${toISODate(selection.start as PlainDate)} to ${toISODate(selection.end as PlainDate)}`;
};

/** What the studio shows in its detail: the owner, the place, the calendar and the notes. */
@Component({
  selector: 'sl-ec-summary',
  standalone: true,
  imports: [
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
  ],
  template: `<div slDescriptionList layout="stack">
    @if (event.owner) {
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Owner</dt>
        <dd slDescriptionListDescription>{{ event.owner }}</dd>
      </div>
    }
    @if (event.location) {
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Where</dt>
        <dd slDescriptionListDescription>{{ event.location }}</dd>
      </div>
    }
    <div slDescriptionListItem>
      <dt slDescriptionListTerm>Calendar</dt>
      <dd slDescriptionListDescription>{{ calendar }}</dd>
    </div>
    @if (event.notes) {
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Notes</dt>
        <dd slDescriptionListDescription>{{ event.notes }}</dd>
      </div>
    }
  </div>`,
  inputs: ['occurrence'],
})
class EventSummary {
  occurrence!: EventOccurrence;
  get event(): StudioEvent {
    return this.occurrence.event as StudioEvent;
  }
  get calendar() {
    return STUDIO_CALENDARS.find((entry) => entry.key === this.event.calendar)?.label ?? '—';
  }
}

/** The studio's calendar with every model unbound, and a line saying what it asked for. */
@Component({
  selector: 'sl-ec-playground',
  standalone: true,
  imports: [SlButton, SlEventCalendar, SlEventCalendarActions, SlEventCalendarDetail, EventSummary],
  template: `<div
      slEventCalendar
      [calendars]="calendars"
      [defaultDate]="today"
      [events]="events()"
      locale="en-US"
      editable
      selectionMode="range"
      timeZone="America/Sao_Paulo"
      [workingHours]="hours"
      (eventChangeRequest)="change($event)"
      (dateRequest)="log.set('date → ' + iso($event.value) + ' (' + $event.reason + ')')"
      (viewRequest)="log.set('view → ' + $event.value + ' (' + $event.reason + ')')"
      (openEventRequest)="
        log.set('open → ' + ($event.value ?? 'none') + ' (' + $event.reason + ')')
      "
      (selectionRequest)="
        log.set('selection → ' + describe($event.value) + ' (' + $event.reason + ')')
      "
    >
      <button slButton slEventCalendarActions tone="accent" type="button">New event</button>
      <ng-template slEventCalendarDetail let-occurrence
        ><sl-ec-summary [occurrence]="occurrence"
      /></ng-template>
    </div>
    <p class="slotted-demo-scene__note">{{ log() }}</p>`,
})
class Playground$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = signal<StudioEvent[]>(STUDIO_EVENTS);
  readonly hours = STUDIO_HOURS;
  readonly today = TODAY;
  readonly log = signal('Nothing asked yet.');
  readonly iso = toISODate;
  readonly describe = describeSelection;
  change(request: ChangeRequest<EventCalendarEventChange>) {
    this.events.update((held) => applyChange(held, request.value as never));
    this.log.set(`${request.value.kind} ${request.value.key} (${request.reason})`);
  }
}

/** Moves the application writes back: one occurrence of a series, or the whole event. */
@Component({
  selector: 'sl-ec-editing',
  standalone: true,
  imports: [SlEventCalendar],
  template: `<div
      slEventCalendar
      [calendars]="calendars"
      [defaultDate]="today"
      [defaultView]="view()"
      [editable]="editable"
      [canDrop]="notAtWeekends"
      [events]="events()"
      locale="en-US"
      timeZone="America/Sao_Paulo"
      [workingHours]="hours"
      (eventChangeRequest)="change($event)"
    ></div>
    <p class="slotted-demo-scene__note">{{ log() }}</p>`,
})
class Editing$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = signal<StudioEvent[]>(STUDIO_EVENTS);
  readonly hours = STUDIO_HOURS;
  readonly today = TODAY;
  readonly view = input<'week' | 'month'>('week');
  readonly log = signal(
    'Drag an event, pull its end, or focus it and press Alt with the arrows. The studio is closed at weekends.',
  );
  readonly editable = (occurrence: EventOccurrence) => occurrence.event.status !== 'cancelled';
  /** The studio is closed at weekends: Saturday and Sunday are refused while an event moves. */
  readonly notAtWeekends = (change: EventCalendarEventChange) =>
    dayOfWeek('date' in change.start ? change.start.date : change.start) % 6 !== 0;
  change(request: ChangeRequest<EventCalendarEventChange>) {
    const { value } = request;
    this.events.update((held) => applyChange(held, value as never));
    this.log.set(
      `${value.kind === 'move' ? 'Moved' : 'Resized'} ${value.event.title}${
        value.recurring ? ' (this occurrence only)' : ''
      } — ${request.reason}`,
    );
  }
}

/** Two-way calendars and a search that composes on top. */
@Component({
  selector: 'sl-ec-calendars',
  standalone: true,
  imports: [SlEventCalendar, SlEventCalendarActions, SlTextField, SlTextFieldInput],
  template: `<div
      slEventCalendar
      [calendars]="calendars"
      [defaultDate]="today"
      [events]="events"
      [filter]="matches"
      locale="en-US"
      timeZone="America/Sao_Paulo"
      [(visibleCalendars)]="visible"
    >
      <div slTextField slEventCalendarActions size="sm">
        <input
          slTextFieldInput
          type="search"
          aria-label="Search events"
          placeholder="Search events"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </div>
    </div>
    <p class="slotted-demo-scene__note">Showing {{ visible()?.join(', ') }}.</p>`,
})
class Calendars$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = STUDIO_EVENTS;
  readonly today = TODAY;
  readonly query = signal('');
  readonly visible = signal<readonly string[] | undefined>(['product', 'clients', 'travel']);
  readonly matches = (occurrence: EventOccurrence) =>
    occurrence.event.title.toLowerCase().includes(this.query().toLowerCase());
}

/**
 * Commands per target, run on the demo's own events: open, duplicate and
 * delete an event; create one on an hour, a day or the selection.
 */
@Component({
  selector: 'sl-ec-context-menu',
  standalone: true,
  imports: [SlEventCalendar, SlEventCalendarContextMenu, SlMenuItem, SlMenuSeparator],
  template: `<div
      slEventCalendar
      [calendars]="calendars"
      [defaultDate]="today"
      [events]="events()"
      defaultView="week"
      locale="en-US"
      selectionMode="range"
      timeZone="America/Sao_Paulo"
      [workingHours]="hours"
    >
      <ng-template slEventCalendarContextMenu let-target>
        @if (target.kind === 'event') {
          <button
            slMenuItem
            shortcut="Enter"
            (select)="said.set('Opened “' + target.occurrence.event.title + '”')"
          >
            Open
          </button>
          <button slMenuItem (select)="duplicate(target.occurrence)">Duplicate</button>
          <hr slMenuSeparator />
          <button slMenuItem tone="danger" (select)="remove(target.occurrence)">
            {{ target.occurrence.recurring ? 'Delete series' : 'Delete' }}
          </button>
        } @else {
          <button slMenuItem (select)="create(target.slot)">New event</button>
        }
      </ng-template>
    </div>
    <p class="slotted-demo-scene__note">
      {{
        said() ??
          'Right-click an event, an hour or a selection; on touch, hold; from the keyboard, Shift+F10.'
      }}
    </p>`,
})
class ContextMenu$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = signal<StudioEvent[]>(STUDIO_EVENTS);
  readonly hours = STUDIO_HOURS;
  readonly today = TODAY;
  readonly said = signal<string | null>(null);
  private made = 0;

  create(slot: EventCalendarSelection) {
    this.made += 1;
    const event: StudioEvent = {
      id: `new-${this.made}`,
      title: 'New event',
      start: slot.start,
      end: slot.end,
      calendar: 'product',
    };
    this.events.update((list) => [...list, event]);
    this.said.set(`Created: ${describeSelection(slot)}`);
  }

  duplicate(occurrence: EventOccurrence) {
    const event = occurrence.event as StudioEvent;
    this.made += 1;
    const copy: StudioEvent = {
      ...event,
      id: `${event.id}-copy-${this.made}`,
      title: `${event.title} (copy)`,
      recurrence: undefined,
      ...(occurrence.allDay ? {} : { start: occurrence.start, end: occurrence.end }),
    };
    this.events.update((list) => [...list, copy]);
    this.said.set(`Duplicated “${event.title}”`);
  }

  remove(occurrence: EventOccurrence) {
    this.events.update((list) => list.filter((entry) => entry.id !== occurrence.event.id));
    this.said.set(`Deleted “${occurrence.event.title}”`);
  }
}

/** A selection the application reads and clears. */
@Component({
  selector: 'sl-ec-selection',
  standalone: true,
  imports: [SlButton, SlEventCalendar],
  template: `<div
      slEventCalendar
      [calendars]="calendars"
      [defaultDate]="today"
      [events]="events"
      defaultView="week"
      locale="en-US"
      selectionMode="range"
      timeZone="America/Sao_Paulo"
      [workingHours]="hours"
      [(selection)]="selection"
    ></div>
    <p class="slotted-demo-scene__note">
      @if (selection(); as chosen) {
        New event: {{ describe(chosen) }}
        <button
          slButton
          size="sm"
          tone="secondary"
          type="button"
          variant="ghost"
          (click)="selection.set(null)"
        >
          Clear
        </button>
      } @else {
        Drag across empty hours, or press Space on a day.
      }
    </p>`,
})
class Selection$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = STUDIO_EVENTS;
  readonly hours = STUDIO_HOURS;
  readonly today = TODAY;
  readonly selection = signal<EventCalendarSelection | null | undefined>(null);
  readonly describe = describeSelection;
}

/** The imperative actions, reached through exportAs. */
@Component({
  selector: 'sl-ec-keyboard',
  standalone: true,
  imports: [SlButton, SlEventCalendar],
  template: `<div class="slotted-demo-row">
      <button
        slButton
        size="sm"
        tone="secondary"
        type="button"
        variant="outline"
        (click)="calendar.focusDate(october)"
      >
        Focus 1 October
      </button>
      <button
        slButton
        size="sm"
        tone="secondary"
        type="button"
        variant="outline"
        (click)="calendar.focusEvent('standup@2026-09-24')"
      >
        Focus today’s standup
      </button>
    </div>
    <div
      slEventCalendar
      #calendar="slEventCalendar"
      [calendars]="calendars"
      [defaultDate]="today"
      [events]="events"
      locale="en-US"
      timeZone="America/Sao_Paulo"
    ></div>`,
})
class Keyboard$ {
  readonly calendars = STUDIO_CALENDARS;
  readonly events = STUDIO_EVENTS;
  readonly today = TODAY;
  readonly october = plainDate(2026, 10, 1);
}

/** Instants as a server sends them, converted once for the zone the reader is in. */
const NEW_YORK_EVENTS = [
  ['shift', 'Night support shift', Date.UTC(2026, 10, 1, 4, 30), Date.UTC(2026, 10, 1, 8, 30)],
  [
    'handoff-1',
    'On-call handoff, first 1:30',
    Date.UTC(2026, 10, 1, 5, 30),
    Date.UTC(2026, 10, 1, 6, 0),
  ],
  [
    'handoff-2',
    'On-call handoff, second 1:30',
    Date.UTC(2026, 10, 1, 6, 30),
    Date.UTC(2026, 10, 1, 7, 0),
  ],
  ['backups', 'Backups', Date.UTC(2026, 10, 1, 10, 0), Date.UTC(2026, 10, 1, 11, 0)],
].map(([id, title, startsAt, endsAt]) => ({
  id: id as string,
  title: title as string,
  calendar: 'product',
  start: wallClockIn(startsAt as number, 'America/New_York'),
  end: wallClockIn(endsAt as number, 'America/New_York'),
}));

const STUDIO = `[calendars]="calendars" [defaultDate]="today" [events]="events" locale="en-US" timeZone="America/Sao_Paulo"`;
const PROPS = {
  calendars: STUDIO_CALENDARS,
  events: STUDIO_EVENTS,
  today: TODAY,
  hours: STUDIO_HOURS,
};

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
const grid = (...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="1">${scenes.join('')}</div>`;
const room = (name: 'phone' | 'laptop', body: string) =>
  `<div class="slotted-demo-room" data-room="${name}"><div class="slotted-demo-viewport"${name === 'phone' ? ' data-fill' : ' data-scroll'} data-size="screen">${body}</div></div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_EVENT_CALENDAR_DOCS.eventCalendar.scenes, {
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

const meta: Meta = {
  title: 'Components/EventCalendar',
  decorators: [
    moduleMetadata({
      imports: [
        SlAlert,
        SlAlertContent,
        SlAlertDescription,
        SlAlertTitle,
        SlButton,
        SlEventCalendar,
        SlEventCalendarActions,
        SlEventCalendarDayContent,
        SlEventCalendarDetail,
        SlEventCalendarEmpty,
        SlEventCalendarError,
        SlEventCalendarEvent,
        EventSummary,
        Playground$,
        Calendars$,
        ContextMenu$,
        Selection$,
        Editing$,
        Keyboard$,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Event Calendar',
        description:
          'Dated events in four views — month, week, day and list — over wall-clock values: the family expands recurrence, lays overlapping events out in columns, marks today, now and the day a zone changes its clocks, and asks with a reason to move the date, the view, the calendars in view, the chosen stretch and the open event. Below 600 pixels the month and the week read as a list.',
        framework: 'Angular',
        ...ANGULAR_EVENT_CALENDAR_DOCS.eventCalendar,
        tokens: ANGULAR_EVENT_CALENDAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({ template: `<sl-ec-playground />` }),
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => ({
    props: { ...PROPS, planner: ['week', 'day', 'month'], agenda: ['list'] },
    template: grid(
      scene(
        'A planner',
        'Week first, then day and month; no list.',
        `<div slEventCalendar ${STUDIO} [views]="planner"></div>`,
      ),
      scene(
        'An agenda',
        'One view, so no switcher is drawn at all.',
        `<div slEventCalendar ${STUDIO} [views]="agenda"></div>`,
      ),
    ),
  }),
};

export const Month: Story = {
  parameters: scenario('month'),
  render: () => ({
    props: { ...PROPS, run: { start: plainDate(2026, 9, 29), end: plainDate(2026, 9, 30) } },
    template: `<div slEventCalendar ${STUDIO} defaultOpenEvent="planning@2026-09-21" [defaultSelection]="run" selectionMode="range" weekNumbers [workingHours]="hours"></div>`,
  }),
};

export const Week: Story = {
  parameters: scenario('week'),
  render: () => ({
    props: { ...PROPS, span: [8, 20] },
    template: `<div slEventCalendar ${STUDIO} [dayHours]="span" defaultView="week" weekends="hidden"></div>`,
  }),
};

export const Day: Story = {
  parameters: scenario('day'),
  render: () => ({
    props: { ...PROPS, today: plainDate(2026, 9, 23) },
    template: `<div slEventCalendar ${STUDIO} defaultView="day" [slotDuration]="15"></div>`,
  }),
};

export const List: Story = {
  parameters: scenario('list'),
  render: () => ({
    props: PROPS,
    template: `<div slEventCalendar ${STUDIO} defaultView="list" listRange="month"></div>`,
  }),
};

export const AllDay: Story = {
  parameters: scenario('all-day'),
  render: () => ({
    props: { ...PROPS, release: plainDate(2026, 9, 17), october: plainDate(2026, 10, 1) },
    template: grid(
      scene(
        'The release week',
        'The release crosses midnight: one block on each day.',
        `<div slEventCalendar [calendars]="calendars" [defaultDate]="release" [events]="events" defaultView="week" locale="en-US" timeZone="America/Sao_Paulo"></div>`,
      ),
      scene(
        'The same events in the month',
        'A conference, a trip across a weekend, a leave across two weeks.',
        `<div slEventCalendar [calendars]="calendars" [defaultDate]="october" [events]="events" locale="en-US" timeZone="America/Sao_Paulo"></div>`,
      ),
    ),
  }),
};

export const Overlap: Story = {
  parameters: scenario('overlap'),
  render: () => ({
    props: { ...PROPS, late: { hour: 10, minute: 30, second: 0 } },
    template: grid(
      scene(
        'maxColumns 3',
        'Wednesday’s four meetings share three columns; Thursday’s five panels draw two and a +3.',
        `<div slEventCalendar ${STUDIO} defaultView="week" [scrollTime]="late"></div>`,
      ),
      scene(
        'maxColumns 5',
        'With room for all five, none folds.',
        `<div slEventCalendar ${STUDIO} defaultView="day" [maxColumns]="5" [scrollTime]="late"></div>`,
      ),
    ),
  }),
};

export const Recurrence: Story = {
  parameters: scenario('recurrence'),
  render: () => ({
    props: { ...PROPS, today: plainDate(2026, 9, 21) },
    template: `<div slEventCalendar ${STUDIO} defaultView="week"></div>`,
  }),
};

export const TimeZone: Story = {
  parameters: scenario('time-zone'),
  render: () => ({
    props: {
      ...PROPS,
      shifts: NEW_YORK_EVENTS,
      november: plainDate(2026, 11, 1),
      night: [0, 12],
      midnight: { hour: 0, minute: 0, second: 0 },
    },
    template: grid(
      scene(
        // language: pt-BR
        'São Paulo',
        'GMT-3 in the gutter; the now line is São Paulo’s now.',
        // language: en-US
        `<div slEventCalendar ${STUDIO} defaultView="day"></div>`,
      ),
      scene(
        'New York, 1 November',
        'The clocks go back at 2 AM; both handoffs at 1:30 share the hour that repeats.',
        `<div slEventCalendar [calendars]="calendars" [dayHours]="night" [defaultDate]="november" defaultView="day" [events]="shifts" locale="en-US" [scrollTime]="midnight" timeZone="America/New_York"></div>`,
      ),
    ),
  }),
};

export const Calendars: Story = {
  parameters: scenario('calendars'),
  render: () => ({ template: `<sl-ec-calendars />` }),
};

export const WorkingHours: Story = {
  parameters: scenario('working-hours'),
  render: () => ({
    props: PROPS,
    template: `<div slEventCalendar ${STUDIO} defaultView="week" [workingHours]="hours"></div>`,
  }),
};

export const DayContent: Story = {
  parameters: scenario('day-content'),
  render: () => ({
    props: { ...PROPS, onCall: (date: PlainDate) => ON_CALL[toISODate(date)] ?? '' },
    template: grid(
      scene(
        'In the week',
        'Under the date, centerd with it.',
        `<div slEventCalendar ${STUDIO} defaultView="week"><ng-template slEventCalendarDayContent let-date>{{ onCall(date) }}</ng-template></div>`,
      ),
      scene(
        'In the month',
        'At the end of the header line, truncated before the number is.',
        `<div slEventCalendar ${STUDIO}><ng-template slEventCalendarDayContent let-date>{{ onCall(date) }}</ng-template></div>`,
      ),
    ),
  }),
};

export const Detail: Story = {
  parameters: scenario('detail'),
  render: () => ({
    props: PROPS,
    template: `<div slEventCalendar ${STUDIO} defaultView="week">
      <ng-template slEventCalendarDetail let-occurrence let-close="close">
          <sl-ec-summary [occurrence]="occurrence" />
          <div class="slotted-demo-row"><button slButton size="sm" tone="secondary" type="button" variant="outline" (click)="close()">Edit</button></div>
      </ng-template>
    </div>`,
  }),
};

export const ContextMenu: Story = {
  parameters: scenario('context-menu'),
  render: () => ({ template: `<sl-ec-context-menu />` }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({ template: `<sl-ec-selection />` }),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => ({
    template: grid(
      scene(
        'In the hours',
        'Minutes snap to the slot; the column under the pointer is the day.',
        `<sl-ec-editing view="week" />`,
      ),
      scene(
        'In the month',
        'Whole days; a bar’s end pulls to make it longer.',
        `<sl-ec-editing view="month" />`,
      ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: { ...PROPS, events: [] },
    template: `<div slEventCalendar ${STUDIO} loading [loadingDelay]="0"></div>`,
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    props: { ...PROPS, events: [], today: plainDate(2026, 12, 30) },
    template: `<div slEventCalendar ${STUDIO} defaultView="list">
      <button slButton slEventCalendarEmpty size="sm" tone="accent" type="button">New event</button>
    </div>`,
  }),
};

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => ({
    props: { ...PROPS, events: [] },
    template: `<div slEventCalendar ${STUDIO}>
      <section slAlert slEventCalendarError tone="danger" variant="soft">
        <div slAlertContent>
          <div slAlertTitle>The events for October could not be loaded.</div>
          <p slAlertDescription>The calendar service did not answer. The grid still moves between months.</p>
        </div>
      </section>
    </div>`,
  }),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'compact list (default)',
        'The month reads as the month’s list; an event opens its detail as a sheet from the bottom.',
        room(
          'phone',
          `<div slEventCalendar ${STUDIO} listRange="month"><ng-template slEventCalendarDetail let-occurrence><sl-ec-summary [occurrence]="occurrence" /></ng-template></div>`,
        ),
      ),
      scene(
        'compact keep',
        'The grid stays: marks of color; a day opens its events as a sheet from the bottom.',
        room(
          'phone',
          `<div slEventCalendar ${STUDIO} compact="keep"><ng-template slEventCalendarDetail let-occurrence><sl-ec-summary [occurrence]="occurrence" /></ng-template></div>`,
        ),
      ),
    ),
  }),
};

export const CustomEvent: Story = {
  parameters: scenario('custom-event'),
  render: () => ({
    props: { ...PROPS, today: plainDate(2026, 9, 16), noon: { hour: 12, minute: 0, second: 0 } },
    template: `<div slEventCalendar ${STUDIO} defaultView="day" [scrollTime]="noon">
      <ng-template slEventCalendarEvent let-occurrence let-time="time">
        <span data-part="event-title" data-part-event-title="">{{ occurrence.event.title }}</span>
        @if (time) {
          <span data-part="event-time" data-part-event-time="">{{ time }}</span>
        }
        @if (occurrence.event.owner) {
          <span data-part="event-location" data-part-event-location="">{{ occurrence.event.owner }}</span>
        }
      </ng-template>
    </div>`,
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  decorators: [
    applicationConfig({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'pt-BR',
        'Sunday first, a 24-hour clock, and every word from the Portuguese catalog provideSlotted puts in force.',
        `<div slEventCalendar [calendars]="calendars" [defaultDate]="today" [events]="events" defaultView="week" locale="pt-BR" timeZone="America/Sao_Paulo"></div>`,
      ),
      scene(
        'he, right to left',
        'The grid, the chevrons and the bars mirror; English titles keep their own direction.',
        `<div dir="rtl"><div slEventCalendar [calendars]="calendars" [defaultDate]="today" [events]="events" locale="he" timeZone="America/Sao_Paulo"></div></div>`,
      ),
    ),
  }),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => ({
    props: PROPS,
    template: room(
      'laptop',
      `<div data-slotted-density="dense"><div slEventCalendar ${STUDIO} defaultView="week"></div></div>`,
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({ template: `<sl-ec-keyboard />` }),
};
