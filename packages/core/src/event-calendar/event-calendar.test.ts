import { describe, expect, it } from 'vitest';

import { plainDate, toISODate, toISODateTime } from '../date';
import type { PlainDate, PlainDateTime } from '../date';
import {
  calendarColor,
  compareOccurrences,
  contextSlot,
  formatHour,
  formatTimeRange,
  movePlacement,
  nextAllowedPlacement,
  placeOccurrence,
  placementOf,
  resizePlacement,
  withPlacement,
  isWorkingDay,
  layoutColumn,
  layoutRow,
  listDays,
  moveDate,
  occurrencesIn,
  occurrencesOn,
  occurrenceTimes,
  offHoursOn,
  offsetChangeOn,
  overflowByDay,
  stepView,
  viewRange,
  listDayParts,
  occurrenceWhen,
  slotMinutes,
  viewTitle,
  zoneLabel,
} from './index';
import type { CalendarEvent, EventOccurrence } from './index';

const d = (text: string): PlainDate => {
  const [year, month, day] = text.split('-').map(Number) as [number, number, number];
  return plainDate(year, month, day);
};
const t = (text: string): PlainDateTime => {
  const [date, time] = text.split('T') as [string, string];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  return { date: d(date), time: { hour, minute, second: 0 } };
};
const iso = (dates: readonly PlainDate[]) => dates.map(toISODate);
const options = { firstDayOfWeek: 1, weekends: 'shown' as const };
const keys = <E extends CalendarEvent>(list: readonly EventOccurrence<E>[]) =>
  list.map((entry) => entry.key);

describe('viewRange', () => {
  it('covers the whole weeks of the month grid', () => {
    const range = viewRange('month', d('2026-09-24'), options);
    expect(toISODate(range.start)).toBe('2026-08-31');
    expect(toISODate(range.end)).toBe('2026-10-04');
    expect(range.weeks).toHaveLength(5);
    expect(range.weeks[0]).toHaveLength(7);
  });

  it('draws six weeks with fixedWeeks and five days without weekends', () => {
    expect(
      viewRange('month', d('2026-09-24'), { ...options, fixedWeeks: true }).weeks,
    ).toHaveLength(6);
    const range = viewRange('month', d('2026-09-24'), { ...options, weekends: 'hidden' });
    expect(iso(range.weeks[0] ?? [])).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
    ]);
  });

  it('starts the week on the day the locale or the consumer names', () => {
    expect(iso(viewRange('week', d('2026-09-24'), { ...options, firstDayOfWeek: 0 }).days)).toEqual(
      [
        '2026-09-20',
        '2026-09-21',
        '2026-09-22',
        '2026-09-23',
        '2026-09-24',
        '2026-09-25',
        '2026-09-26',
      ],
    );
    expect(
      viewRange('week', d('2026-09-24'), { ...options, weekends: 'hidden' }).days,
    ).toHaveLength(5);
  });

  it('covers one day, and the week or month of a list', () => {
    expect(iso(viewRange('day', d('2026-09-24'), options).days)).toEqual(['2026-09-24']);
    expect(viewRange('list', d('2026-09-24'), options).days).toHaveLength(7);
    const month = viewRange('list', d('2026-09-24'), { ...options, listRange: 'month' });
    expect(toISODate(month.start)).toBe('2026-09-01');
    expect(toISODate(month.end)).toBe('2026-09-30');
  });
});

describe('stepView', () => {
  it('steps by the period of the view', () => {
    expect(toISODate(stepView('month', d('2026-01-31'), 1, options))).toBe('2026-02-28');
    expect(toISODate(stepView('week', d('2026-09-24'), -1, options))).toBe('2026-09-17');
    expect(toISODate(stepView('day', d('2026-09-24'), 1, options))).toBe('2026-09-25');
    expect(
      toISODate(stepView('list', d('2026-09-24'), 1, { ...options, listRange: 'month' })),
    ).toBe('2026-10-24');
  });

  it('skips the weekend a day view does not show', () => {
    const workweek = { ...options, weekends: 'hidden' as const };
    expect(toISODate(stepView('day', d('2026-09-25'), 1, workweek))).toBe('2026-09-28');
    expect(toISODate(stepView('day', d('2026-09-28'), -1, workweek))).toBe('2026-09-25');
  });
});

describe('occurrencesIn', () => {
  const events: CalendarEvent[] = [
    {
      id: 'standup',
      title: 'Standup',
      start: t('2026-09-21T09:00'),
      end: t('2026-09-21T09:15'),
      recurrence: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
      exceptions: [d('2026-09-23')],
    },
    {
      id: 'moved',
      title: 'Standup, moved',
      start: t('2026-09-24T10:00'),
      end: t('2026-09-24T10:15'),
      recurrenceOf: 'standup',
      occurrence: d('2026-09-24'),
    },
    { id: 'offsite', title: 'Offsite', start: d('2026-09-22'), end: d('2026-09-24') },
    { id: 'late', title: 'Release', start: t('2026-09-20T22:00'), end: t('2026-09-21T02:00') },
    {
      id: 'midnight',
      title: 'Ends at midnight',
      start: t('2026-09-27T22:00'),
      end: t('2026-09-28T00:00'),
    },
    { id: 'point', title: 'Reminder', start: t('2026-09-25T12:00') },
    {
      id: 'broken',
      title: 'Bad rule',
      start: t('2026-09-22T15:00'),
      end: t('2026-09-22T16:00'),
      recurrence: 'FREQ=HOURLY',
    },
  ];

  it('expands series, removes exceptions and puts a replaced occurrence in place of its date', () => {
    const found = occurrencesIn(events, d('2026-09-21'), d('2026-09-27'));
    expect(keys(found).filter((key) => key.startsWith('standup'))).toEqual([
      'standup@2026-09-21',
      'standup@2026-09-22',
      'standup@2026-09-24',
      'standup@2026-09-25',
    ]);
    const moved = found.find((entry) => entry.key === 'standup@2026-09-24');
    expect(moved?.event.title).toBe('Standup, moved');
    expect(moved?.recurring).toBe(true);
    expect(toISODateTime(moved?.start as PlainDateTime)).toBe('2026-09-24T10:00:00');
  });

  it('reads an all-day end as the last day and a timed end as the moment it stops', () => {
    const found = occurrencesIn(events, d('2026-09-21'), d('2026-09-27'));
    const offsite = found.find((entry) => entry.key === 'offsite');
    expect(offsite?.allDay).toBe(true);
    expect(toISODateTime(offsite?.end as PlainDateTime)).toBe('2026-09-25T00:00:00');
    expect(found.find((entry) => entry.key === 'late')).toBeDefined();
    expect(found.find((entry) => entry.key === 'midnight')).toBeDefined();
    expect(found.find((entry) => entry.key === 'broken')?.recurring).toBe(false);
  });

  it('keeps an event that began before the window and reaches into it', () => {
    expect(keys(occurrencesIn(events, d('2026-09-21'), d('2026-09-21')))).toContain('late');
    expect(keys(occurrencesIn(events, d('2026-09-28'), d('2026-09-28')))).not.toContain('midnight');
  });

  it('orders by start, then longer first, then all-day, then title', () => {
    const list: CalendarEvent[] = [
      { id: 'b', title: 'Beta', start: t('2026-09-21T09:00'), end: t('2026-09-21T10:00') },
      { id: 'a', title: 'Alpha', start: t('2026-09-21T09:00'), end: t('2026-09-21T10:00') },
      { id: 'long', title: 'Long', start: t('2026-09-21T09:00'), end: t('2026-09-21T12:00') },
      { id: 'day', title: 'Day', start: d('2026-09-21') },
    ];
    expect(keys(occurrencesIn(list, d('2026-09-21'), d('2026-09-21')))).toEqual([
      'day',
      'long',
      'a',
      'b',
    ]);
    expect(typeof compareOccurrences).toBe('function');
  });

  it('finds the occurrences a day holds, a midnight end excluded', () => {
    const found = occurrencesIn(events, d('2026-09-20'), d('2026-09-28'));
    expect(keys(occurrencesOn(found, d('2026-09-21')))).toContain('late');
    expect(keys(occurrencesOn(found, d('2026-09-28')))).not.toContain('midnight');
    expect(keys(occurrencesOn(found, d('2026-09-25')))).toContain('point');
  });
});

describe('occurrenceTimes', () => {
  it('says which ends of an occurrence fall on the day', () => {
    const [late] = occurrencesIn(
      [{ id: 'late', title: 'Release', start: t('2026-09-20T22:00'), end: t('2026-09-21T02:00') }],
      d('2026-09-20'),
      d('2026-09-21'),
    ) as [EventOccurrence<CalendarEvent>];
    expect(occurrenceTimes(late, d('2026-09-20'))).toEqual({
      start: { hour: 22, minute: 0, second: 0 },
      end: null,
    });
    expect(occurrenceTimes(late, d('2026-09-21'))).toEqual({
      start: null,
      end: { hour: 2, minute: 0, second: 0 },
    });
  });
});

describe('layoutRow', () => {
  const week = viewRange('week', d('2026-09-21'), options).days;
  const events: CalendarEvent[] = [
    { id: 'conf', title: 'Conference', start: d('2026-09-19'), end: d('2026-09-23') },
    { id: 'trip', title: 'Trip', start: d('2026-09-22'), end: d('2026-09-24') },
    { id: 'tue', title: 'Tuesday', start: t('2026-09-22T09:00'), end: t('2026-09-22T10:00') },
    { id: 'wed', title: 'Wednesday', start: d('2026-09-23') },
    { id: 'sun', title: 'Into next week', start: d('2026-09-27'), end: d('2026-09-29') },
  ];
  const found = occurrencesIn(events, week[0] as PlainDate, week[6] as PlainDate);

  it('puts each occurrence on the first lane free on all its days', () => {
    const { segments, lanes } = layoutRow(found, week, {});
    const by = Object.fromEntries(segments.map((entry) => [entry.occurrence.key, entry]));
    expect(by['conf']).toMatchObject({
      lane: 0,
      start: 0,
      span: 3,
      continuesBefore: true,
      continuesAfter: false,
    });
    expect(by['trip']).toMatchObject({ lane: 1, start: 1, span: 3 });
    expect(by['tue']).toMatchObject({ lane: 2, start: 1, span: 1 });
    expect(by['wed']).toMatchObject({ lane: 2, start: 2, span: 1 });
    expect(by['sun']).toMatchObject({ lane: 0, start: 6, span: 1, continuesAfter: true });
    expect(lanes).toBe(3);
  });

  it('keeps only all-day occurrences for the all-day row', () => {
    const { segments } = layoutRow(found, week, { allDayOnly: true });
    expect(segments.map((entry) => entry.occurrence.key)).not.toContain('tue');
  });

  it('counts, per day, the occurrences in lanes past the limit', () => {
    const { segments } = layoutRow(found, week, {});
    expect(overflowByDay(segments, week.length, 2)).toEqual([0, 1, 1, 0, 0, 0, 0]);
  });
});

describe('layoutColumn', () => {
  const day = d('2026-09-22');
  const at = (id: string, start: string, end: string): CalendarEvent => ({
    id,
    title: id,
    start: t(`2026-09-22T${start}`),
    end: t(`2026-09-22T${end}`),
  });

  it('gives overlapping occurrences columns and lets each span the free ones', () => {
    const found = occurrencesIn(
      [
        at('a', '09:00', '11:00'),
        at('b', '09:30', '10:00'),
        at('c', '10:00', '10:30'),
        at('d', '12:00', '13:00'),
      ],
      day,
      day,
    );
    const { items, more } = layoutColumn(found, day, {
      startHour: 0,
      endHour: 24,
      maxColumns: 3,
      minLength: 20,
    });
    const by = Object.fromEntries(items.map((entry) => [entry.occurrence.key, entry]));
    expect(by['a']).toMatchObject({ start: 540, length: 120, column: 0, columns: 2, span: 1 });
    expect(by['b']).toMatchObject({ column: 1, columns: 2, span: 1 });
    expect(by['c']).toMatchObject({ column: 1, columns: 2, span: 1 });
    expect(by['d']).toMatchObject({ column: 0, columns: 1, span: 1 });
    expect(more).toEqual([]);
  });

  it('folds the columns past the limit into one more', () => {
    const found = occurrencesIn(
      ['a', 'b', 'c', 'd', 'e'].map((id) => at(id, '09:00', '10:00')),
      day,
      day,
    );
    const { items, more } = layoutColumn(found, day, {
      startHour: 0,
      endHour: 24,
      maxColumns: 3,
      minLength: 20,
    });
    expect(items.map((entry) => entry.column)).toEqual([0, 1]);
    expect(items.every((entry) => entry.columns === 3)).toBe(true);
    expect(more).toHaveLength(1);
    expect(more[0]).toMatchObject({ column: 2, columns: 3, start: 540, length: 60 });
    expect(more[0]?.occurrences.map((entry) => entry.key)).toEqual(['c', 'd', 'e']);
  });

  it('cuts an occurrence to the visible hours and says which end was cut', () => {
    const found = occurrencesIn(
      [at('early', '06:00', '09:00'), at('out', '19:00', '20:00')],
      day,
      day,
    );
    const { items } = layoutColumn(found, day, {
      startHour: 8,
      endHour: 18,
      maxColumns: 3,
      minLength: 20,
    });
    const by = Object.fromEntries(items.map((entry) => [entry.occurrence.key, entry]));
    expect(by['early']).toMatchObject({
      start: 0,
      length: 60,
      clippedStart: true,
      clippedEnd: false,
    });
    expect(by['out']).toMatchObject({
      start: 600,
      length: 0,
      clippedStart: true,
      clippedEnd: true,
    });
  });

  it('draws the part of a night event that falls on each day', () => {
    const found = occurrencesIn(
      [{ id: 'late', title: 'late', start: t('2026-09-21T22:00'), end: t('2026-09-22T02:00') }],
      d('2026-09-21'),
      day,
    );
    const { items } = layoutColumn(found, day, {
      startHour: 0,
      endHour: 24,
      maxColumns: 3,
      minLength: 20,
    });
    expect(items[0]).toMatchObject({
      start: 0,
      length: 120,
      continuesBefore: true,
      continuesAfter: false,
    });
  });

  it('leaves all-day occurrences to the row', () => {
    const found = occurrencesIn([{ id: 'x', title: 'x', start: day }], day, day);
    expect(
      layoutColumn(found, day, { startHour: 0, endHour: 24, maxColumns: 3, minLength: 20 }).items,
    ).toEqual([]);
  });
});

describe('listDays', () => {
  it('groups by day and leaves out the empty ones', () => {
    const found = occurrencesIn(
      [
        { id: 'a', title: 'a', start: d('2026-09-22'), end: d('2026-09-23') },
        { id: 'b', title: 'b', start: t('2026-09-25T09:00'), end: t('2026-09-25T10:00') },
      ],
      d('2026-09-21'),
      d('2026-09-27'),
    );
    const days = listDays(found, viewRange('week', d('2026-09-21'), options).days);
    expect(days.map((entry) => [toISODate(entry.date), keys(entry.occurrences)])).toEqual([
      ['2026-09-22', ['a']],
      ['2026-09-23', ['a']],
      ['2026-09-25', ['b']],
    ]);
  });
});

describe('moveDate', () => {
  it('moves a day, a week and to the edges of the week in the month', () => {
    expect(toISODate(moveDate('month', d('2026-09-24'), 'next', options))).toBe('2026-09-25');
    expect(toISODate(moveDate('month', d('2026-09-24'), 'down', options))).toBe('2026-10-01');
    expect(toISODate(moveDate('month', d('2026-09-24'), 'rowStart', options))).toBe('2026-09-21');
    expect(toISODate(moveDate('month', d('2026-09-24'), 'rowEnd', options))).toBe('2026-09-27');
    expect(toISODate(moveDate('month', d('2026-09-24'), 'periodStart', options))).toBe(
      '2026-09-01',
    );
    expect(toISODate(moveDate('month', d('2026-09-24'), 'periodEnd', options))).toBe('2026-09-30');
    expect(toISODate(moveDate('month', d('2026-01-31'), 'pageForward', options))).toBe(
      '2026-02-28',
    );
    expect(toISODate(moveDate('month', d('2026-09-24'), 'yearBack', options))).toBe('2025-09-24');
  });

  it('steps over the days the grid does not draw', () => {
    const workweek = { ...options, weekends: 'hidden' as const };
    expect(toISODate(moveDate('week', d('2026-09-25'), 'next', workweek))).toBe('2026-09-28');
    expect(toISODate(moveDate('week', d('2026-09-24'), 'rowEnd', workweek))).toBe('2026-09-25');
    expect(toISODate(moveDate('month', d('2026-09-25'), 'next', workweek))).toBe('2026-09-28');
  });
});

describe('time zone', () => {
  it('finds the minute a zone moves its clocks, and the direction', () => {
    expect(offsetChangeOn(d('2026-03-08'), 'America/New_York')).toEqual({
      at: { hour: 2, minute: 0, second: 0 },
      minutes: 60,
    });
    expect(offsetChangeOn(d('2026-11-01'), 'America/New_York')).toEqual({
      at: { hour: 2, minute: 0, second: 0 },
      minutes: -60,
    });
    expect(offsetChangeOn(d('2026-09-24'), 'America/New_York')).toBeNull();
    expect(offsetChangeOn(d('2026-03-08'), 'America/Sao_Paulo')).toBeNull();
  });

  it('names the zone by its offset on the day', () => {
    expect(zoneLabel(d('2026-09-24'), 'America/Sao_Paulo', 'en-US')).toBe('GMT-3');
    expect(zoneLabel(d('2026-09-24'), 'UTC', 'en-US')).toMatch(/^GMT/);
  });
});

describe('viewTitle', () => {
  it('writes the period in the locale', () => {
    const at = d('2026-09-24');
    expect(viewTitle('month', viewRange('month', at, options), at, { locale: 'en-US' })).toBe(
      'September 2026',
    );
    expect(
      viewTitle('week', viewRange('week', at, options), at, { locale: 'en-US' }).replace(
        /\s/g,
        ' ',
      ),
    ).toBe('Sep 21 – 27, 2026');
    expect(viewTitle('day', viewRange('day', at, options), at, { locale: 'en-US' })).toBe(
      'Thursday, September 24, 2026',
    );
  });
});

describe('calendarColor', () => {
  it('uses the colour given, then the position, and never cycles', () => {
    const calendars = Array.from({ length: 9 }, (_, index) => ({
      key: `c${index}`,
      label: `C${index}`,
    }));
    expect(calendarColor('c0', calendars)).toBe(1);
    expect(calendarColor('c7', calendars)).toBe(8);
    expect(calendarColor('c8', calendars)).toBeNull();
    expect(calendarColor('c1', [{ key: 'c1', label: 'x', color: 5 }])).toBe(5);
    expect(calendarColor(undefined, calendars)).toBeNull();
  });
});

describe('formatHour', () => {
  it('writes the period on a 12-hour clock and the minutes on a 24-hour one', () => {
    expect(formatHour(10, { locale: 'en-US' }).replace(/\s/g, ' ')).toBe('10 AM');
    expect(formatHour(10, { locale: 'pt-BR' })).toBe('10:00');
    expect(formatHour(0, { locale: 'en-GB' })).toBe('00:00');
    expect(formatHour(13, { locale: 'en-US', hourCycle: 'h23' })).toBe('13:00');
  });
});

describe('formatTimeRange', () => {
  it('shares what the two ends share, and writes one time once', () => {
    const ten = { hour: 10, minute: 0, second: 0 };
    const eleven = { hour: 11, minute: 0, second: 0 };
    expect(formatTimeRange(ten, eleven, { locale: 'en-US' }).replace(/\s/g, ' ')).toBe(
      '10:00 – 11:00 AM',
    );
    expect(formatTimeRange(ten, eleven, { locale: 'pt-BR' }).replace(/\s/g, ' ')).toBe(
      '10:00 – 11:00',
    );
    expect(formatTimeRange(ten, ten, { locale: 'pt-BR' })).toBe('10:00');
  });
});

describe('working hours', () => {
  const clinic = [
    {
      days: [1, 2, 3, 4, 5],
      start: { hour: 9, minute: 0, second: 0 },
      end: { hour: 12, minute: 0, second: 0 },
    },
    {
      days: [1, 2, 3, 4, 5],
      start: { hour: 14, minute: 0, second: 0 },
      end: { hour: 18, minute: 0, second: 0 },
    },
  ];

  it('gives the stretches outside working hours, inside the visible ones', () => {
    expect(offHoursOn(d('2026-09-24'), clinic, { startHour: 8, endHour: 20 })).toEqual([
      { start: 0, length: 60 },
      { start: 240, length: 120 },
      { start: 600, length: 120 },
    ]);
  });

  it('shades the whole visible range on a day no entry names, and nothing without entries', () => {
    expect(offHoursOn(d('2026-09-26'), clinic, { startHour: 8, endHour: 20 })).toEqual([
      { start: 0, length: 720 },
    ]);
    expect(offHoursOn(d('2026-09-26'), [], { startHour: 0, endHour: 24 })).toEqual([]);
    expect(isWorkingDay(d('2026-09-26'), clinic)).toBe(false);
    expect(isWorkingDay(d('2026-09-24'), clinic)).toBe(true);
    expect(isWorkingDay(d('2026-09-26'), [])).toBe(true);
  });

  it('reads an end at midnight as the end of the day', () => {
    const late = [
      {
        days: [4],
        start: { hour: 18, minute: 0, second: 0 },
        end: { hour: 0, minute: 0, second: 0 },
      },
    ];
    expect(offHoursOn(d('2026-09-24'), late, { startHour: 0, endHour: 24 })).toEqual([
      { start: 0, length: 1080 },
    ]);
  });
});

describe('editing', () => {
  const timed = occurrencesIn(
    [{ id: 'review', title: 'Review', start: t('2026-09-23T13:00'), end: t('2026-09-23T14:30') }],
    d('2026-09-23'),
    d('2026-09-23'),
  )[0] as EventOccurrence<CalendarEvent>;
  const allDay = occurrencesIn(
    [{ id: 'trip', title: 'Trip', start: d('2026-09-26'), end: d('2026-09-28') }],
    d('2026-09-26'),
    d('2026-09-28'),
  )[0] as EventOccurrence<CalendarEvent>;

  it('moves a timed occurrence by days and minutes and keeps its length', () => {
    const moved = movePlacement(placementOf(timed), { days: 1, minutes: 90 });
    expect(toISODateTime(moved.start)).toBe('2026-09-24T14:30:00');
    expect(toISODateTime(moved.end)).toBe('2026-09-24T16:00:00');
  });

  it('moves an all-day occurrence by whole days, and ignores minutes', () => {
    const moved = movePlacement(placementOf(allDay), { days: -2, minutes: 45 });
    expect(placeOccurrence(moved)).toEqual({ start: d('2026-09-24'), end: d('2026-09-26') });
  });

  it('resizes the end, never shorter than the step it is resized by', () => {
    const longer = resizePlacement(placementOf(timed), { days: 0, minutes: 30 }, 30);
    expect(toISODateTime(longer.end)).toBe('2026-09-23T15:00:00');
    const shortest = resizePlacement(placementOf(timed), { days: 0, minutes: -300 }, 30);
    expect(toISODateTime(shortest.end)).toBe('2026-09-23T13:30:00');
    const oneDay = resizePlacement(placementOf(allDay), { days: -9, minutes: 0 }, 30);
    expect(placeOccurrence(oneDay)).toEqual({ start: d('2026-09-26'), end: d('2026-09-26') });
  });

  it('writes a placement back in the kind the event holds', () => {
    expect(placeOccurrence(placementOf(timed))).toEqual({
      start: t('2026-09-23T13:00'),
      end: t('2026-09-23T14:30'),
    });
  });

  it('draws the occurrence being moved where it would land', () => {
    const others = occurrencesIn(
      [{ id: 'x', title: 'x', start: t('2026-09-23T09:00'), end: t('2026-09-23T10:00') }],
      d('2026-09-23'),
      d('2026-09-23'),
    );
    const list = [...others, timed];
    const moved = withPlacement(
      list,
      'review',
      movePlacement(placementOf(timed), { days: 0, minutes: -240 }),
    );
    expect(moved.map((entry) => toISODateTime(entry.start))).toEqual([
      '2026-09-23T09:00:00',
      '2026-09-23T09:00:00',
    ]);
    expect(withPlacement(list, 'nothing', placementOf(timed))).toBe(list);
  });

  describe('nextAllowedPlacement', () => {
    const hours = [0, 24] as const;
    const startsAt = (placement: { start: PlainDateTime }) => toISODateTime(placement.start);

    it('takes the first step when the destination is allowed', () => {
      const next = nextAllowedPlacement(placementOf(timed), { days: 0, minutes: 30 }, 'move', {
        slot: 30,
        hours,
        allowed: () => true,
      });
      expect(next && startsAt(next)).toBe('2026-09-23T13:30:00');
    });

    it('passes over refused destinations to the next allowed one, one step at a time', () => {
      const refused = new Set(['2026-09-23T13:30:00', '2026-09-23T14:00:00']);
      const next = nextAllowedPlacement(placementOf(timed), { days: 0, minutes: 30 }, 'move', {
        slot: 30,
        hours,
        allowed: (placement) => !refused.has(startsAt(placement)),
      });
      expect(next && startsAt(next)).toBe('2026-09-23T14:30:00');
    });

    it('resizes past a refused end the same way', () => {
      const next = nextAllowedPlacement(placementOf(timed), { days: 0, minutes: 30 }, 'resize', {
        slot: 30,
        hours,
        allowed: (placement) => toISODateTime(placement.end) !== '2026-09-23T15:00:00',
      });
      expect(next && toISODateTime(next.end)).toBe('2026-09-23T15:30:00');
    });

    it('gives up after the visible hours, or six weeks of days, and answers null', () => {
      let asked = 0;
      const never = () => {
        asked += 1;
        return false;
      };
      const byMinutes = { slot: 30, hours: [8, 18] as const, allowed: never };
      expect(
        nextAllowedPlacement(placementOf(timed), { days: 0, minutes: 30 }, 'move', byMinutes),
      ).toBeNull();
      expect(asked).toBe(20);
      asked = 0;
      expect(
        nextAllowedPlacement(placementOf(allDay), { days: 7, minutes: 0 }, 'move', {
          slot: 30,
          hours,
          allowed: never,
        }),
      ).toBeNull();
      expect(asked).toBe(6);
    });
  });
});

describe('listDayParts', () => {
  it('writes the weekday and the date as two parts, in the locale', () => {
    expect(listDayParts({ year: 2026, month: 9, day: 1 }, 'en-US')).toEqual({
      weekday: 'Tuesday',
      date: 'September 1',
      label: 'Tuesday, September 1',
    });
    expect(listDayParts({ year: 2026, month: 9, day: 1 }, 'pt-BR')).toEqual({
      // language: pt-BR
      weekday: 'terça-feira',
      date: '1 de setembro',
      label: 'terça-feira, 1 de setembro',
      // language: en-US
    });
  });
});

describe('layoutColumn in a day one column wide', () => {
  it('draws the first column whole and lays the count of the rest over it', () => {
    const at = (hour: number, minute = 0) => ({
      date: { year: 2026, month: 9, day: 24 },
      time: { hour, minute, second: 0 },
    });
    const events = [
      { id: 'a', title: 'A', start: at(11), end: at(12) },
      { id: 'b', title: 'B', start: at(11), end: at(12) },
      { id: 'c', title: 'C', start: at(11, 30), end: at(12) },
    ];
    const day = { year: 2026, month: 9, day: 24 };
    const occurrences = occurrencesIn(events, day, day);
    const { items, more } = layoutColumn(occurrences, day, {
      startHour: 0,
      endHour: 24,
      maxColumns: 1,
      minLength: 20,
    });
    expect(items.map((item) => [item.occurrence.key, item.column, item.columns])).toEqual([
      ['a', 0, 1],
    ]);
    expect(more).toHaveLength(1);
    expect(more[0]).toMatchObject({ column: 0, columns: 1, overlay: true });
    expect(more[0]?.occurrences.map((occurrence) => occurrence.key)).toEqual(['b', 'c']);
  });
});

describe('occurrenceWhen', () => {
  const at = (day: number, hour: number, minute = 0) => ({
    date: { year: 2026, month: 9, day },
    time: { hour, minute, second: 0 },
  });
  it('writes the day and the hours of a timed occurrence as two parts', () => {
    const [occurrence] = occurrencesIn(
      [{ id: 'a', title: 'A', start: at(16, 13), end: at(16, 14, 30) }],
      { year: 2026, month: 9, day: 16 },
      { year: 2026, month: 9, day: 16 },
    );
    const when = occurrenceWhen(occurrence!, { locale: 'en-US' });
    expect(when.day).toBe('Wednesday, September 16');
    expect(when.range.replace(/\s/g, ' ')).toBe('1:00 – 2:30 PM');
  });

  it('writes an all-day occurrence as its range alone', () => {
    const [occurrence] = occurrencesIn(
      [{ id: 'b', title: 'B', start: { year: 2026, month: 9, day: 7 } }],
      { year: 2026, month: 9, day: 7 },
      { year: 2026, month: 9, day: 7 },
    );
    expect(occurrenceWhen(occurrence!, { locale: 'en-US' }).day).toBeNull();
  });
});

describe('slotMinutes', () => {
  it('takes any whole number of minutes from 5 to 120', () => {
    expect([1, 5, 10, 12.4, 45, 90, 240].map(slotMinutes)).toEqual([5, 5, 10, 12, 45, 90, 120]);
    expect(slotMinutes(Number.NaN)).toBe(30);
  });
});

describe('contextSlot', () => {
  const base = { slot: 30, endMinute: 1440, held: null };
  const iso = (value: { start: PlainDate | PlainDateTime; end: PlainDate | PlainDateTime }) =>
    'time' in value.start
      ? `${toISODateTime(value.start)}/${toISODateTime(value.end as PlainDateTime)}`
      : `${toISODate(value.start)}/${toISODate(value.end as PlainDate)}`;

  it('is one step at the pointer in a timed column, and the day elsewhere', () => {
    expect(iso(contextSlot({ ...base, date: d('2026-09-22'), minute: 600, timed: true }))).toBe(
      '2026-09-22T10:00:00/2026-09-22T10:30:00',
    );
    expect(iso(contextSlot({ ...base, date: d('2026-09-22'), minute: null, timed: false }))).toBe(
      '2026-09-22/2026-09-22',
    );
    expect(iso(contextSlot({ ...base, date: d('2026-09-22'), minute: null, timed: true }))).toBe(
      '2026-09-22/2026-09-22',
    );
  });

  it('keeps the last step inside the day', () => {
    expect(iso(contextSlot({ ...base, date: d('2026-09-22'), minute: 1440, timed: true }))).toBe(
      '2026-09-22T23:30:00/2026-09-23T00:00:00',
    );
    expect(
      iso(
        contextSlot({ ...base, endMinute: 1080, date: d('2026-09-22'), minute: 1080, timed: true }),
      ),
    ).toBe('2026-09-22T17:30:00/2026-09-22T18:00:00');
  });

  it('is the selection when the pointer or the focus is inside it', () => {
    const hours = { start: t('2026-09-22T09:00:00'), end: t('2026-09-22T11:00:00') };
    expect(
      contextSlot({ ...base, held: hours, date: d('2026-09-22'), minute: 630, timed: true }),
    ).toBe(hours);
    expect(
      contextSlot({ ...base, held: hours, date: d('2026-09-22'), minute: null, timed: true }),
    ).toBe(hours);
    expect(
      iso(contextSlot({ ...base, held: hours, date: d('2026-09-22'), minute: 660, timed: true })),
    ).toBe('2026-09-22T11:00:00/2026-09-22T11:30:00');
    const days = { start: d('2026-09-21'), end: d('2026-09-23') };
    expect(
      contextSlot({ ...base, held: days, date: d('2026-09-22'), minute: null, timed: false }),
    ).toBe(days);
    expect(
      iso(contextSlot({ ...base, held: days, date: d('2026-09-24'), minute: null, timed: false })),
    ).toBe('2026-09-24/2026-09-24');
  });
});
