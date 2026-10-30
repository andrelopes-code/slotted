import { plainDate } from '@slotted/core/date';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/event-calendar/contract.json';
import { SlottedProvider } from '../i18n';
import { MenuItem } from '../menu';
import { EventCalendar, EventCalendarDefaultsProvider } from './index';
import type {
  CalendarEvent,
  EventCalendarEventChange,
  EventCalendarHandle,
  EventCalendarSelection,
} from './index';

const at = (day: number, hour: number, minute = 0, month = 9): PlainDateTime => ({
  date: plainDate(2026, month, day),
  time: { hour, minute, second: 0 },
});
const day = (value: number, month = 9): PlainDate => plainDate(2026, month, value);

const calendars = [
  { key: 'work', label: 'Work' },
  { key: 'home', label: 'Home' },
];

const events: CalendarEvent[] = [
  { id: 'offsite', title: 'Offsite', start: day(8), end: day(10), calendar: 'work' },
  {
    id: 'standup',
    title: 'Standup',
    start: at(21, 9),
    end: at(21, 9, 15),
    calendar: 'work',
    recurrence: 'FREQ=DAILY;COUNT=3',
  },
  {
    id: 'dentist',
    title: 'Dentist',
    start: at(22, 14, 30),
    end: at(22, 15, 15),
    calendar: 'home',
    status: 'tentative',
  },
  { id: 'a', title: 'Design review', start: at(23, 13), end: at(23, 15), calendar: 'work' },
  { id: 'b', title: 'Vendor sync', start: at(23, 13, 30), end: at(23, 14), calendar: 'home' },
];

const cell = (iso: string, row = 'day') =>
  document.querySelector(`[data-row='${row}'][data-date='${iso}']`) as HTMLElement;
const roving = () => document.querySelector("[data-row][tabindex='0']") as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-24T15:40:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the shape the contract declares', () => {
  it('is selected by the family identifier, and draws the month as a labelled grid', () => {
    const { container } = render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const root = container.querySelector("[data-ui='event-calendar']") as HTMLElement;
    expect(root.dataset['part']).toBe('root');
    expect(root.dataset['view']).toBe('month');
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAccessibleName('September 2026');
    expect(contract.ui).toBe('event-calendar');
    const parts = new Set(
      [...container.querySelectorAll('[data-part]')].map(
        (element) => (element as HTMLElement).dataset['part'],
      ),
    );
    for (const part of [
      'header',
      'title',
      'navigation',
      'previous',
      'today',
      'next',
      'views',
      'filter',
      'body',
      'month',
      'week',
      'day',
      'day-number',
      'day-events',
      'event',
      'event-title',
      'event-meta',
      'continuation',
    ]) {
      expect(parts, part).toContain(part);
    }
  });

  it('puts one cell of the grid in the tab order, the one holding the date', () => {
    render(<EventCalendar defaultDate={day(24)} events={[]} locale="en-US" timeZone="UTC" />);
    expect(roving()).toBe(cell('2026-09-24'));
    expect(document.querySelectorAll("[data-row][tabindex='0']")).toHaveLength(1);
  });

  it('draws a multi-day event as one bar across its days, and names it on each day after', () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const bar = document.querySelector("[data-key='offsite']") as HTMLElement;
    expect(bar.hasAttribute('data-bar')).toBe(true);
    expect(bar.style.getPropertyValue('--slotted-event-span')).toBe('3');
    expect(within(cell('2026-09-09')).getByText('Offsite, continues')).toBeInTheDocument();
  });

  it('expands a recurring event and names every occurrence without its color', () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const occurrences = document.querySelectorAll("[data-key^='standup@']");
    expect(occurrences).toHaveLength(3);
    const first = occurrences[0] as HTMLElement;
    expect(first).toHaveAccessibleName(expect.stringContaining('Standup'));
    expect(first).toHaveAccessibleName(expect.stringContaining('Work'));
    expect(first).toHaveAccessibleName(expect.stringContaining('repeats'));
    expect(document.querySelector("[data-key='dentist']")).toHaveAccessibleName(
      expect.stringContaining('tentative'),
    );
  });
});

describe('the date', () => {
  it('asks to move a period with the reason of the gesture, and waits when controlled', () => {
    const onDateChange = vi.fn();
    render(
      <EventCalendar
        date={day(24)}
        events={[]}
        locale="en-US"
        onDateChange={onDateChange}
        timeZone="UTC"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }), { detail: 1 });
    expect(onDateChange).toHaveBeenCalledWith(
      day(24, 10),
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(screen.getByRole('grid')).toHaveAccessibleName('September 2026');
  });

  it('moves itself when uncontrolled, and reports the range it now shows', () => {
    const onRangeChange = vi.fn();
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={[]}
        locale="en-US"
        onRangeChange={onRangeChange}
        timeZone="UTC"
      />,
    );
    expect(onRangeChange).toHaveBeenLastCalledWith({
      start: day(30, 8),
      end: day(3, 10),
      view: 'month',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }), { detail: 1 });
    expect(screen.getByRole('grid')).toHaveAccessibleName('August 2026');
    expect(onRangeChange).toHaveBeenLastCalledWith({
      start: day(26, 7),
      end: day(5, 9),
      view: 'month',
    });
  });

  it('goes to today in the calendar zone', () => {
    const onDateChange = vi.fn();
    render(
      <EventCalendar
        defaultDate={day(1, 1)}
        events={[]}
        locale="en-US"
        onDateChange={onDateChange}
        timeZone="Asia/Tokyo"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Today' }), { detail: 1 });
    expect(onDateChange).toHaveBeenLastCalledWith(
      day(25),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

describe('the view', () => {
  it('switches through the views and keeps the date', () => {
    const onViewChange = vi.fn();
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        onViewChange={onViewChange}
        timeZone="UTC"
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Week' }), { detail: 1 });
    expect(onViewChange).toHaveBeenCalledWith(
      'week',
      expect.objectContaining({ previous: 'month' }),
    );
    expect(screen.getByRole('grid')).toHaveAccessibleName(expect.stringMatching(/Sep 20/));
  });

  it('drills from a day number into that day', () => {
    render(<EventCalendar defaultDate={day(24)} events={events} locale="en-US" timeZone="UTC" />);
    fireEvent.click(
      within(cell('2026-09-22')).getByRole('button', { name: 'Tuesday, September 22' }),
      { detail: 1 },
    );
    expect(document.querySelector("[data-ui='event-calendar']")).toHaveAttribute(
      'data-view',
      'day',
    );
    expect(screen.getByRole('grid')).toHaveAccessibleName('Tuesday, September 22, 2026');
  });

  it('lays overlapping events of a day in columns, from the core module', () => {
    render(
      <EventCalendar
        defaultDate={day(23)}
        defaultView="day"
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const review = document.querySelector("[data-key='a']") as HTMLElement;
    const sync = document.querySelector("[data-key='b']") as HTMLElement;
    expect(review.style.getPropertyValue('--slotted-event-columns')).toBe('2');
    expect(review.style.getPropertyValue('--slotted-event-column')).toBe('0');
    expect(sync.style.getPropertyValue('--slotted-event-column')).toBe('1');
    expect(review.style.getPropertyValue('--slotted-event-start')).toBe('780');
    expect(review.style.getPropertyValue('--slotted-event-length')).toBe('120');
  });

  /**
   * A page dated by its content — a docs console, a screenshot — names its
   * own now: the runtime's clock marked 1 October in a week dated 30 September.
   */
  it('reads now from the now prop, which stops the clock', async () => {
    render(
      <EventCalendar
        defaultDate={day(30)}
        defaultView="week"
        events={[]}
        locale="en-US"
        now={at(30, 9, 30)}
        timeZone="UTC"
      />,
    );
    await act(async () => {});
    const line = () => document.querySelector("[data-part='now']") as HTMLElement;
    expect(line().closest("[data-part='column']")).toHaveAttribute('data-date', '2026-09-30');
    expect(line().style.getPropertyValue('--slotted-event-start')).toBe('570');
    expect(document.querySelectorAll('[data-today]')).not.toHaveLength(0);
    for (const marked of document.querySelectorAll('[data-today]')) {
      expect(marked).toHaveAttribute('data-date', '2026-09-30');
    }
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000);
    });
    expect(line().style.getPropertyValue('--slotted-event-start')).toBe('570');
  });

  it('marks now in today’s column, and the minute a zone changes its clocks', async () => {
    render(
      <EventCalendar
        defaultDate={day(24)}
        defaultView="week"
        events={[]}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    await act(async () => {});
    const now = document.querySelector("[data-part='now']") as HTMLElement;
    expect(now.closest("[data-part='column']")).toHaveAttribute('data-date', '2026-09-24');
    expect(now.style.getPropertyValue('--slotted-event-start')).toBe('940');

    render(
      <EventCalendar
        defaultDate={day(1, 11)}
        defaultView="day"
        events={[]}
        locale="en-US"
        timeZone="America/New_York"
      />,
    );
    expect(screen.getByRole('note')).toHaveAccessibleName('Clocks go back 1 hour at 2:00 AM');
  });

  it('shades the hours nobody works in', () => {
    render(
      <EventCalendar
        defaultDate={day(24)}
        defaultView="day"
        events={[]}
        timeZone="UTC"
        workingHours={[
          {
            days: [1, 2, 3, 4, 5],
            start: { hour: 9, minute: 0, second: 0 },
            end: { hour: 17, minute: 0, second: 0 },
          },
        ]}
      />,
    );
    const off = [...document.querySelectorAll("[data-part='off-hours']")] as HTMLElement[];
    expect(off.map((element) => element.style.getPropertyValue('--slotted-event-length'))).toEqual([
      '540',
      '420',
    ]);
  });

  it('draws the list as a heading per day, and says when there is nothing', () => {
    const { unmount } = render(
      <EventCalendar
        defaultDate={day(24)}
        defaultView="list"
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Tuesday, September 22' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('grid')).toBeNull();
    unmount();
    render(
      <EventCalendar
        defaultDate={day(24, 12)}
        defaultView="list"
        empty={<button type="button">New event</button>}
        events={[]}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    expect(screen.getByText('No events this week.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New event' })).toBeInTheDocument();
  });
});

describe('the keyboard', () => {
  it('moves the day with the arrows and pages the month', () => {
    const onDateChange = vi.fn();
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={[]}
        locale="en-US"
        onDateChange={onDateChange}
        timeZone="UTC"
      />,
    );
    roving().focus();
    fireEvent.keyDown(roving(), { key: 'ArrowRight' });
    expect(onDateChange).toHaveBeenLastCalledWith(
      day(25),
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(document.activeElement).toBe(cell('2026-09-25'));
    fireEvent.keyDown(roving(), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cell('2026-10-02'));
    expect(screen.getByRole('grid')).toHaveAccessibleName('October 2026');
    fireEvent.keyDown(roving(), { key: 'PageUp' });
    expect(document.activeElement).toBe(cell('2026-09-02'));
  });

  it('goes into a day with Enter, through its widgets with the arrows, and out with Escape', () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(23)}
        events={events}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const today = cell('2026-09-23');
    today.focus();
    fireEvent.keyDown(today, { key: 'Enter' });
    expect(document.activeElement).toHaveAttribute('data-part', 'day-number');
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveAttribute('data-key', 'standup@2026-09-23');
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveAttribute('data-key', 'a');
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(document.activeElement).toBe(today);
  });

  it('moves between the rows of a time grid with the vertical arrows', () => {
    render(
      <EventCalendar
        defaultDate={day(24)}
        defaultView="week"
        events={[]}
        locale="en-US"
        timeZone="UTC"
      />,
    );
    const timed = cell('2026-09-24', 'timed');
    timed.focus();
    fireEvent.keyDown(timed, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cell('2026-09-24', 'all-day'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cell('2026-09-24', 'header'));
  });
});

describe('the selection', () => {
  it('chooses a day with Space, a run with Shift and the arrows, and clears with Escape', () => {
    const onSelectionChange = vi.fn();
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={[]}
        locale="en-US"
        onSelectionChange={onSelectionChange}
        selectionMode="range"
        timeZone="UTC"
      />,
    );
    const start = cell('2026-09-24');
    start.focus();
    fireEvent.keyDown(start, { key: ' ' });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      { start: day(24), end: day(24) },
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.keyDown(roving(), { key: 'ArrowRight', shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      { start: day(24), end: day(25) },
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(cell('2026-09-25')).toHaveAttribute('data-selected');
    fireEvent.keyDown(roving(), { key: 'Escape' });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'escape' }),
    );
  });

  it('refuses a request the consumer cancels', () => {
    const selections: (EventCalendarSelection | null)[] = [];
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={[]}
        onSelectionChange={(value, request) => {
          selections.push(value);
          request.cancel();
        }}
        selectionMode="range"
        timeZone="UTC"
      />,
    );
    roving().focus();
    fireEvent.keyDown(roving(), { key: ' ' });
    expect(selections).toHaveLength(1);
    expect(cell('2026-09-24')).not.toHaveAttribute('data-selected');
  });
});

describe('the open event', () => {
  it('asks to open an event, and to close it on a second press', () => {
    const onOpenEventChange = vi.fn();
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        onOpenEventChange={onOpenEventChange}
        timeZone="UTC"
      />,
    );
    const dentist = document.querySelector("[data-key='dentist']") as HTMLElement;
    fireEvent.click(dentist, { detail: 1 });
    expect(onOpenEventChange).toHaveBeenLastCalledWith(
      'dentist',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(dentist).toHaveAttribute('data-open');
    expect(dentist).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(dentist, { detail: 1 });
    expect(onOpenEventChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('hosts the detail in a popover when the consumer renders it', async () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        renderEventDetail={(occurrence) => <p>Detail of {occurrence.event.title}</p>}
        timeZone="UTC"
      />,
    );
    fireEvent.click(document.querySelector("[data-key='dentist']") as HTMLElement, { detail: 1 });
    await act(async () => {});
    expect(screen.getByText('Detail of Dentist')).toBeInTheDocument();
  });

  it('opens the application’s context menu on an event, on a day and from the keyboard', async () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        renderContextMenu={(target) => {
          const { start } = target.kind === 'slot' ? target.slot : { start: null };
          if (start !== null && ('time' in start ? start.date : start).day === 25) return null;
          return <MenuItem>{target.kind === 'event' ? 'Duplicate' : 'New event'}</MenuItem>;
        }}
        timeZone="UTC"
      />,
    );
    await act(async () => {});
    const menu = () => document.querySelector("[data-ui='menu'][data-open] [role='menu']");

    const dentist = document.querySelector("[data-key='dentist']") as HTMLElement;
    expect(fireEvent.contextMenu(dentist, { clientX: 10, clientY: 10 })).toBe(false);
    await act(async () => {});
    expect(menu()).toHaveAttribute('aria-label', 'Dentist');
    expect(within(menu() as HTMLElement).getByRole('menuitem')).toHaveTextContent('Duplicate');
    expect(document.querySelector("[data-key='dentist']")).toHaveAttribute('data-context');
    fireEvent.keyDown(menu() as HTMLElement, { key: 'Escape' });
    await act(async () => {});
    expect(menu()).toBeNull();
    expect(document.querySelector("[data-key='dentist']")).not.toHaveAttribute('data-context');

    fireEvent.contextMenu(cell('2026-09-10'), { clientX: 10, clientY: 10 });
    await act(async () => {});
    expect(menu()).toHaveAttribute('aria-label', 'Thursday, September 10');
    expect(within(menu() as HTMLElement).getByRole('menuitem')).toHaveTextContent('New event');
    expect(cell('2026-09-10')).toHaveAttribute('data-selected');
    fireEvent.keyDown(menu() as HTMLElement, { key: 'Escape' });
    await act(async () => {});

    /* No items for the day: the browser's own menu is left alone. */
    expect(fireEvent.contextMenu(cell('2026-09-25'), { clientX: 10, clientY: 10 })).toBe(true);
    await act(async () => {});
    expect(menu()).toBeNull();

    dentist.focus();
    fireEvent.keyDown(dentist, { key: 'F10', shiftKey: true });
    await act(async () => {});
    expect(menu()).toHaveAttribute('aria-label', 'Dentist');
  });

  it('opens a day and an event as sheets from the bottom below the compact size class', async () => {
    /* jsdom lays nothing out: every box is a phone's width. */
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 640,
      top: 0,
      left: 0,
      right: 360,
      bottom: 640,
    } as DOMRect);
    try {
      render(
        <EventCalendar
          calendars={calendars}
          compact="keep"
          defaultDate={day(24)}
          events={events}
          locale="en-US"
          renderEventDetail={(occurrence) => <p>Detail of {occurrence.event.title}</p>}
          timeZone="UTC"
        />,
      );
      await act(async () => {});
      const number = document.querySelector(
        "[data-row='day'][data-date='2026-09-22'] [data-part='day-number']",
      ) as HTMLElement;
      expect(number).toHaveAttribute('aria-haspopup', 'dialog');

      fireEvent.click(number, { detail: 1 });
      await act(async () => {});
      const sheet = document.querySelector("[data-ui='drawer'][data-side='bottom']") as HTMLElement;
      expect(sheet).not.toBeNull();
      expect(document.querySelector("[data-ui='popover']")).toBeNull();
      expect(sheet.querySelector("[data-part='panel']")).toHaveAttribute('role', 'dialog');
      const inSheet = sheet.querySelector("[data-key='dentist']") as HTMLElement;
      expect(inSheet).not.toBeNull();

      fireEvent.click(inSheet, { detail: 1 });
      await act(async () => {});
      const detail = screen.getByText('Detail of Dentist').closest("[data-ui='drawer']");
      expect(detail).toHaveAttribute('data-side', 'bottom');
      expect(detail?.querySelector("[data-part='detail-range']")).not.toBeNull();
    } finally {
      measure.mockRestore();
    }
  });
});

describe('the calendars', () => {
  it('hides the events of a calendar taken out of view', () => {
    render(
      <EventCalendar
        calendars={calendars}
        defaultDate={day(24)}
        events={events}
        locale="en-US"
        timeZone="UTC"
        visibleCalendars={['work']}
      />,
    );
    expect(document.querySelector("[data-key='dentist']")).toBeNull();
    expect(document.querySelector("[data-key='a']")).not.toBeNull();
  });

  it('keeps an occurrence only when the consumer’s predicate does', () => {
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={events}
        filter={(occurrence) => occurrence.event.title.startsWith('D')}
        timeZone="UTC"
      />,
    );
    expect(document.querySelector("[data-key='dentist']")).not.toBeNull();
    expect(document.querySelector("[data-key='b']")).toBeNull();
  });
});

describe('what an application sets once', () => {
  it('reads the language in force and the working defaults, and lets the instance lay its words over them', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <EventCalendarDefaultsProvider timeZone="UTC">
          <EventCalendar
            defaultDate={day(24)}
            events={[]}
            // language: pt-BR
            messages={{ next: { month: 'Mês seguinte' } }}
            // language: en-US
          />
        </EventCalendarDefaultsProvider>
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mês seguinte' })).toBeInTheDocument();
    // language: en-US
    expect(screen.getByRole('grid')).toHaveAccessibleName('setembro de 2026');
  });

  it('changes its words and its date format together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <EventCalendar defaultDate={day(24)} events={[]} timeZone="UTC" />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName('setembro de 2026');
    // language: en-US

    rerender(inLocale('en-US'));
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName('September 2026');
  });

  it('hands the imperative actions a consumer cannot state as props', () => {
    let handle: EventCalendarHandle | null = null;
    render(
      <EventCalendar
        defaultDate={day(24)}
        events={events}
        ref={(value) => {
          handle = value;
        }}
        timeZone="UTC"
      />,
    );
    act(() => (handle as unknown as EventCalendarHandle).focusDate(day(3, 10)));
    expect(screen.getByRole('grid')).toHaveAccessibleName(expect.stringMatching(/October/));
    expect(document.activeElement).toBe(cell('2026-10-03'));
    expect((handle as unknown as EventCalendarHandle).focusEvent('nothing')).toBe(false);
  });
});

describe('time', () => {
  it('draws an event that ended before now a step back', () => {
    const later: CalendarEvent = { id: 'later', title: 'Later', start: at(25, 9), end: at(25, 10) };
    render(
      <EventCalendar
        defaultDate={day(23)}
        defaultView="week"
        events={[...events, later]}
        timeZone="UTC"
      />,
    );
    expect(document.querySelector("[data-key='a']")).toHaveAttribute('data-past');
    expect(document.querySelector("[data-key='standup@2026-09-23']")).toHaveAttribute('data-past');
    expect(document.querySelector("[data-key='later']")).not.toHaveAttribute('data-past');
  });
});

describe('editing', () => {
  it('moves an editable event a slot, a day and its end with Alt and the arrows', () => {
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        defaultDate={day(23)}
        defaultView="week"
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    const review = document.querySelector("[data-key='a']") as HTMLElement;
    expect(review).toHaveAttribute('data-editable');
    expect(review.querySelector("[data-part='resize-handle']")).not.toBeNull();
    review.focus();
    fireEvent.keyDown(review, { key: 'ArrowDown', altKey: true });
    expect(changes.at(-1)).toMatchObject({
      key: 'a',
      kind: 'move',
      start: at(23, 13, 30),
      end: at(23, 15, 30),
    });
    fireEvent.keyDown(review, { key: 'ArrowRight', altKey: true });
    expect(changes.at(-1)).toMatchObject({ start: at(24, 13), end: at(24, 15) });
    fireEvent.keyDown(review, { key: 'ArrowUp', altKey: true, shiftKey: true });
    expect(changes.at(-1)).toMatchObject({
      kind: 'resize',
      start: at(23, 13),
      end: at(23, 14, 30),
    });
  });

  it('moves by any step of minutes, and rules the hours at it', () => {
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        defaultDate={day(23)}
        defaultView="week"
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        slotDuration={10}
        timeZone="UTC"
      />,
    );
    const grid = document.querySelector("[data-part='time-grid']") as HTMLElement;
    expect(grid.style.getPropertyValue('--slotted-event-calendar-slot')).toBe('10');
    const review = document.querySelector("[data-key='a']") as HTMLElement;
    review.focus();
    fireEvent.keyDown(review, { key: 'ArrowDown', altKey: true });
    expect(changes.at(-1)).toMatchObject({ start: at(23, 13, 10), end: at(23, 15, 10) });
  });

  it('writes an all-day move back in dates, and refuses nothing it was not asked', () => {
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        defaultDate={day(8)}
        editable={(occurrence) => occurrence.event.id === 'offsite'}
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    expect(document.querySelector("[data-key='dentist']")).not.toHaveAttribute('data-editable');
    const offsite = document.querySelector("[data-key='offsite']") as HTMLElement;
    offsite.focus();
    fireEvent.keyDown(offsite, { key: 'ArrowRight', altKey: true });
    expect(changes.at(-1)).toMatchObject({ kind: 'move', start: day(9), end: day(11) });
  });

  it('drags a bar by the day under the pointer, not by the day it starts on', () => {
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        defaultDate={day(8)}
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    /* jsdom lays nothing out: the two days the hand crosses get boxes. */
    const place = (iso: string, left: number) => {
      cell(iso).getBoundingClientRect = () =>
        ({ left, right: left + 100, top: 0, bottom: 100, width: 100, height: 100 }) as DOMRect;
    };
    place('2026-09-09', 100);
    place('2026-09-10', 200);
    const offsite = document.querySelector("[data-key='offsite']") as HTMLElement;
    fireEvent.pointerDown(offsite, { button: 0, clientX: 150, clientY: 50 });
    fireEvent.pointerMove(document, { clientX: 250, clientY: 50 });
    expect(document.querySelector("[data-key='offsite']")).toHaveAttribute('data-dragging');
    expect(changes).toHaveLength(0);
    fireEvent.pointerUp(document, { clientX: 250, clientY: 50 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: 'move', start: day(9), end: day(11) });
    expect(document.querySelector("[data-key='offsite']")).not.toHaveAttribute('data-dragging');
  });

  it('draws a destination canDrop refuses, and asks nothing when let go there', () => {
    const changes: EventCalendarEventChange[] = [];
    const asked: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        canDrop={(change) => {
          asked.push(change);
          return (change.start as PlainDate).day !== 9;
        }}
        defaultDate={day(8)}
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    const place = (iso: string, left: number) => {
      cell(iso).getBoundingClientRect = () =>
        ({ left, right: left + 100, top: 0, bottom: 100, width: 100, height: 100 }) as DOMRect;
    };
    place('2026-09-08', 0);
    place('2026-09-09', 100);
    const offsite = document.querySelector("[data-key='offsite']") as HTMLElement;
    fireEvent.pointerDown(offsite, { button: 0, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 50 });
    const dragged = document.querySelector("[data-key='offsite']");
    expect(dragged).toHaveAttribute('data-dragging');
    expect(dragged).toHaveAttribute('data-drop-invalid');
    expect(asked.at(-1)).toMatchObject({ key: 'offsite', kind: 'move', start: day(9) });
    fireEvent.pointerUp(document, { clientX: 150, clientY: 50 });
    expect(changes).toHaveLength(0);
    expect(document.querySelector("[data-key='offsite']")).not.toHaveAttribute('data-drop-invalid');
  });

  it('passes over refused destinations with Alt and the arrows', () => {
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        canDrop={(change) => ![9, 10].includes((change.start as PlainDate).day)}
        defaultDate={day(8)}
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    const offsite = document.querySelector("[data-key='offsite']") as HTMLElement;
    offsite.focus();
    fireEvent.keyDown(offsite, { key: 'ArrowRight', altKey: true });
    expect(changes.at(-1)).toMatchObject({ kind: 'move', start: day(11), end: day(13) });
  });

  it('keeps the event where it is when no destination in reach is allowed', () => {
    const announce = vi.spyOn(getLiveAnnouncer(document), 'announce');
    const changes: EventCalendarEventChange[] = [];
    render(
      <EventCalendar
        canDrop={() => false}
        defaultDate={day(8)}
        editable
        events={events}
        onEventChange={(change) => changes.push(change)}
        timeZone="UTC"
      />,
    );
    const offsite = document.querySelector("[data-key='offsite']") as HTMLElement;
    offsite.focus();
    fireEvent.keyDown(offsite, { key: 'ArrowRight', altKey: true });
    expect(changes).toHaveLength(0);
    expect(announce).toHaveBeenCalledWith('Offsite cannot move there');
  });
});
