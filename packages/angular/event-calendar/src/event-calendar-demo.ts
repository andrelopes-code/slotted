import { plainDate, toISODate } from '@slotted/core/date';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import type { CalendarEvent, EventCalendarCalendar, WorkingHours } from './event-calendar-defaults';

/**
 * One product for every demonstration: the shared calendar of Northwind
 * Studio, a design studio of twelve people, in September 2026. Real names,
 * real rooms, a client's address that is longer than a cell, a series that
 * repeats every weekday, a trip across a weekend, a cancelled offsite and a
 * dentist appointment nobody confirmed.
 */
export const TODAY = plainDate(2026, 9, 24);

const at = (month: number, day: number, hour: number, minute = 0): PlainDateTime => ({
  date: plainDate(2026, month, day),
  time: { hour, minute, second: 0 },
});
const on = (month: number, day: number): PlainDate => plainDate(2026, month, day);

export const STUDIO_CALENDARS: EventCalendarCalendar[] = [
  { key: 'product', label: 'Product' },
  { key: 'clients', label: 'Client work' },
  { key: 'travel', label: 'Travel' },
  { key: 'people', label: 'People' },
];

export interface StudioEvent extends CalendarEvent {
  readonly owner?: string;
  readonly notes?: string;
}

export const STUDIO_EVENTS: StudioEvent[] = [
  {
    id: 'standup',
    title: 'Studio standup',
    start: at(9, 1, 9, 30),
    end: at(9, 1, 9, 45),
    calendar: 'product',
    recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    exceptions: [on(9, 7)],
    location: 'Room 2',
    owner: 'Marta Silva',
  },
  {
    id: 'planning',
    title: 'Sprint planning',
    start: at(9, 7, 10),
    end: at(9, 7, 11),
    calendar: 'product',
    recurrence: { frequency: 'weekly', interval: 2, byWeekday: [1] },
    location: 'Room 4',
    owner: 'Marta Silva',
    notes: 'Bring the estimates for the onboarding flow.',
  },
  {
    id: 'planning-moved',
    title: 'Sprint planning (moved)',
    start: at(9, 22, 14),
    end: at(9, 22, 15),
    calendar: 'product',
    recurrenceOf: 'planning',
    occurrence: on(9, 21),
    location: 'Room 4',
  },
  { id: 'labor', title: 'Labor Day', start: on(9, 7), calendar: 'people' },
  {
    id: 'conference',
    title: 'Design Systems Conference',
    start: on(9, 8),
    end: on(9, 10),
    calendar: 'travel',
    location: 'Porto',
  },
  {
    id: 'offsite',
    title: 'Team offsite',
    start: on(9, 11),
    calendar: 'product',
    status: 'cancelled',
  },
  {
    id: 'harbor',
    title: 'Harbor Bank — quarterly business review with the regional leadership team',
    start: at(9, 16, 13),
    end: at(9, 16, 14, 30),
    calendar: 'clients',
    location: 'Harbor Bank, 5th floor, 1200 Market Street',
    owner: 'Priya Raman',
  },
  {
    id: 'lunch',
    title: 'Lunch with Ana',
    start: at(9, 16, 12),
    end: at(9, 16, 13),
    calendar: 'people',
  },
  {
    id: 'oneonone',
    title: '1:1 with Priya',
    start: at(9, 16, 15),
    end: at(9, 16, 15, 30),
    calendar: 'people',
  },
  {
    id: 'retro',
    title: 'Retrospective',
    start: at(9, 16, 16),
    end: at(9, 16, 17),
    calendar: 'product',
  },
  {
    id: 'release',
    title: 'Release window',
    start: at(9, 17, 22),
    end: at(9, 18, 2),
    calendar: 'product',
    owner: 'Thomas Reyes',
  },
  {
    id: 'hardening',
    title: 'Sprint 42 hardening',
    start: on(9, 21),
    end: on(9, 23),
    calendar: 'product',
  },
  {
    id: 'dentist',
    title: 'Dentist',
    start: at(9, 22, 16, 30),
    end: at(9, 22, 17, 15),
    calendar: 'people',
    status: 'tentative',
  },
  {
    id: 'critique',
    title: 'Design critique',
    start: at(9, 23, 13),
    end: at(9, 23, 15),
    calendar: 'product',
    location: 'Studio',
  },
  {
    id: 'vendor',
    title: 'Vendor sync',
    start: at(9, 23, 13, 30),
    end: at(9, 23, 14),
    calendar: 'clients',
  },
  {
    id: 'lisbon-call',
    title: 'Call with the Lisbon office',
    start: at(9, 23, 14),
    end: at(9, 23, 14, 30),
    calendar: 'travel',
  },
  {
    id: 'migration',
    title: 'Write the migration note',
    start: at(9, 23, 14, 15),
    end: at(9, 23, 15, 30),
    calendar: 'product',
  },
  ...[
    ['panel-ana', 'Hiring panel — Ana', 'people'],
    ['panel-bruno', 'Hiring panel — Bruno', 'people'],
    ['budget', 'Budget check', 'clients'],
    ['office-hours', 'Office hours', 'product'],
    ['pairing', 'Pairing on the date picker', 'product'],
  ].map(([id, title, calendar]) => ({
    id: id as string,
    title: title as string,
    start: at(9, 24, 11),
    end: at(9, 24, 12),
    calendar: calendar as string,
  })),
  {
    id: 'focus',
    title: 'Focus time',
    start: at(9, 25, 15),
    end: at(9, 25, 17, 30),
    calendar: 'product',
  },
  {
    id: 'lisbon',
    title: 'Lisbon trip',
    start: on(9, 26),
    end: on(9, 29),
    calendar: 'travel',
    location: 'Lisbon',
  },
  {
    id: 'leave',
    title: 'Ana — parental leave',
    start: on(10, 5),
    end: on(10, 16),
    calendar: 'people',
  },
  {
    id: 'kickoff',
    title: 'Kickoff — Meridian Health portal',
    start: at(10, 1, 10),
    end: at(10, 1, 11, 30),
    calendar: 'clients',
    location: 'Video call',
  },
];

/**
 * What the studio's store does with a move: one occurrence of a series becomes
 * a replacement for that date (the series is untouched), anything else moves
 * whole. It is the application's decision, written once here for the demos.
 */
export function applyChange<E extends StudioEvent>(
  events: readonly E[],
  change: {
    event: E;
    occurrence: PlainDate;
    recurring: boolean;
    start: PlainDate | PlainDateTime;
    end: PlainDate | PlainDateTime;
  },
): E[] {
  const { event } = change;
  if (change.recurring && event.recurrenceOf === undefined) {
    const id = `${event.id}@${toISODate(change.occurrence)}`;
    const replacement = {
      ...event,
      id,
      recurrence: undefined,
      exceptions: undefined,
      recurrenceOf: event.id,
      occurrence: change.occurrence,
      start: change.start,
      end: change.end,
    } as E;
    return [...events.filter((entry) => entry.id !== id), replacement];
  }
  return events.map((entry) =>
    entry.id === event.id ? ({ ...entry, start: change.start, end: change.end } as E) : entry,
  );
}

/** Office hours: 9 to 6 on weekdays, as the studio's own page states them. */
export const STUDIO_HOURS: WorkingHours[] = [
  {
    days: [1, 2, 3, 4, 5],
    start: { hour: 9, minute: 0, second: 0 },
    end: { hour: 18, minute: 0, second: 0 },
  },
];

/** Who is on call each day of the release week, which is what the studio writes on a day. */
export const ON_CALL: Record<string, string> = {
  '2026-09-21': 'On call: Thomas',
  '2026-09-22': 'On call: Thomas',
  '2026-09-23': 'On call: Priya',
  '2026-09-24': 'On call: Priya',
  '2026-09-25': 'On call: Marta',
};
