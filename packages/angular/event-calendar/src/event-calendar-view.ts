import {
  compareDate,
  compareDateTime,
  isPlainDateTime,
  isSameDate,
  isoWeekNumber,
  secondsOfDay,
  toISODate,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import {
  calendarColor,
  formatHour,
  formatOccurrence,
  formatTime,
  formatTimeRange,
  isMultiDay,
  isWorkingDay,
  layoutColumn,
  layoutRow,
  listDayParts,
  listDays,
  occurrencesOn,
  occurrenceTimes,
  offHoursOn,
  offsetChangeOn,
  overflowByDay,
  zoneLabel,
} from '@slotted/core/event-calendar';
import type {
  EventCalendarCalendar,
  EventCalendarView,
  EventOccurrence,
  WorkingHours,
} from '@slotted/core/event-calendar';
import type { EventCalendarMessages, FamilyTranslator } from '@slotted/core/i18n';

import type { EventCalendarHourCycle, EventCalendarSelection } from './event-calendar-defaults';

/** A block shorter than this puts its time beside its title, on one line. */
const SHORT_MINUTES = 45;
/** The shortest block drawn, in minutes, which decides whether two short events touch. */
const MIN_BLOCK_MINUTES = 20;

/**
 * Everything the drawing reads, gathered once per change. The template only
 * draws: every lane, span, minute and column is `@slotted/core/event-calendar`'s,
 * the arithmetic the React binding runs too.
 */
export interface DrawingInput {
  readonly id: string;
  /** The family's words in the language in force, with the calendar's `messages` laid over them. */
  readonly t: FamilyTranslator<EventCalendarMessages>;
  readonly locale: string;
  readonly hourCycle: EventCalendarHourCycle | undefined;
  readonly timeZone: string | undefined;
  readonly view: EventCalendarView;
  readonly date: PlainDate;
  readonly today: PlainDate | null;
  readonly now: PlainDateTime | null;
  readonly calendars: readonly EventCalendarCalendar[];
  readonly openKey: string | null;
  readonly selection: EventCalendarSelection | null;
  readonly narrow: boolean;
  readonly maxEvents: number;
  readonly maxColumns: number;
  readonly dayHours: readonly [number, number];
  readonly workingHours: readonly WorkingHours[];
  readonly row: 'header' | 'all-day' | 'timed';
  readonly canEdit: (occurrence: EventOccurrence) => boolean;
  readonly draggingKey: string | null;
  /** Whether `canDrop` refuses where the dragged occurrence would land. */
  readonly dropInvalid: boolean;
  /** The event a context menu is open on. */
  readonly contextKey: string | null;
}

export type EventLayout = 'lane' | 'bar' | 'block' | 'list';

export interface EventView {
  readonly key: string;
  readonly occurrence: EventOccurrence;
  readonly layout: EventLayout;
  readonly date: PlainDate;
  readonly href: string | null;
  readonly color: string | null;
  readonly status: string | null;
  readonly allDay: boolean;
  readonly bar: boolean;
  readonly open: boolean;
  readonly continuesBefore: boolean;
  readonly continuesAfter: boolean;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
  readonly short: boolean;
  /** It ended before now: drawn a step back. */
  readonly past: boolean;
  /** Moves and resizes: `editable` said so and it is drawn in the grid, not a list. */
  readonly editable: boolean;
  readonly dragging: boolean;
  /** Being dragged over a destination `canDrop` refuses. */
  readonly dropInvalid: boolean;
  readonly context: boolean;
  /** The end an edit can pull, only where the event ends in this drawing. */
  readonly resizable: boolean;
  readonly time: string | null;
  readonly title: string;
  readonly location: string | null;
  readonly meta: string;
  readonly style: Record<string, number>;
}

export const fullDate = (locale: string | undefined, date: PlainDate) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));

const weekday = (locale: string | undefined, date: PlainDate, style: 'long' | 'short') =>
  new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: style }).format(
    new Date(Date.UTC(date.year, date.month - 1, date.day)),
  );

const minutesOf = (value: PlainDateTime) => secondsOfDay(value.time) / 60;

/** The time an occurrence shows on one day. */
export function timeLabel(
  input: DrawingInput,
  occurrence: EventOccurrence,
  date: PlainDate,
): string {
  if (occurrence.allDay) return input.t('allDay');
  const options = { locale: input.locale, hourCycle: input.hourCycle };
  const { start, end } = occurrenceTimes(occurrence, date);
  if (start !== null && end !== null) return formatTimeRange(start, end, options);
  if (start !== null) return input.t('from', { time: formatTime(start, options) });
  if (end !== null) return input.t('until', { time: formatTime(end, options) });
  return input.t('allDay');
}

function metaText(input: DrawingInput, occurrence: EventOccurrence, continued: boolean): string {
  const parts = [
    formatOccurrence(occurrence, { locale: input.locale, hourCycle: input.hourCycle }),
    occurrence.allDay ? input.t('allDay') : undefined,
    input.calendars.find((entry) => entry.key === occurrence.event.calendar)?.label,
    occurrence.event.status === 'tentative' ? input.t('tentative') : undefined,
    occurrence.event.status === 'cancelled' ? input.t('cancelled') : undefined,
    occurrence.recurring ? input.t('recurring') : undefined,
    continued ? input.t('continues') : undefined,
  ].filter((part): part is string => part !== undefined && part !== '');
  /* A list of descriptors, written the way the locale in force lists them. */
  return `, ${new Intl.ListFormat(input.locale, { type: 'unit' }).format(parts)}`;
}

export function eventView(
  input: DrawingInput,
  occurrence: EventOccurrence,
  date: PlainDate,
  layout: EventLayout,
  flags: {
    continuesBefore?: boolean;
    continuesAfter?: boolean;
    clippedStart?: boolean;
    clippedEnd?: boolean;
    short?: boolean;
    withLocation?: boolean;
    style?: Record<string, number>;
  } = {},
): EventView {
  const { event } = occurrence;
  const color = calendarColor(event.calendar, input.calendars);
  const bar = layout === 'bar';
  const options = { locale: input.locale, hourCycle: input.hourCycle };
  const time =
    bar && occurrence.allDay
      ? null
      : layout === 'lane' || bar
        ? formatTime(occurrence.start.time, options)
        : timeLabel(input, occurrence, date);
  const editable = layout !== 'list' && input.canEdit(occurrence);
  const resizable =
    editable &&
    (layout === 'block'
      ? flags.clippedEnd !== true && flags.continuesAfter !== true
      : bar && flags.continuesAfter !== true);
  return {
    key: occurrence.key,
    occurrence,
    layout,
    date,
    href: event.href ?? null,
    color: color === null ? null : String(color),
    status: event.status === undefined || event.status === 'confirmed' ? null : event.status,
    allDay: occurrence.allDay,
    bar,
    open: input.openKey === occurrence.key,
    continuesBefore: flags.continuesBefore === true,
    continuesAfter: flags.continuesAfter === true,
    clippedStart: flags.clippedStart === true,
    clippedEnd: flags.clippedEnd === true,
    short: flags.short === true,
    past: input.now !== null && compareDateTime(occurrence.end, input.now) <= 0,
    editable,
    dragging: input.draggingKey === occurrence.key,
    dropInvalid: input.draggingKey === occurrence.key && input.dropInvalid,
    context: input.contextKey === occurrence.key,
    resizable,
    time,
    title: event.title,
    location: flags.withLocation === true ? (event.location ?? null) : null,
    meta: metaText(input, occurrence, flags.continuesBefore === true),
    style: flags.style ?? {},
  };
}

function holdsDay(selection: EventCalendarSelection | null, date: PlainDate): boolean {
  if (selection === null || isPlainDateTime(selection.start)) return false;
  const { start, end } = selection as { start: PlainDate; end: PlainDate };
  return compareDate(date, start) >= 0 && compareDate(date, end) <= 0;
}

/* ── The month ─────────────────────────────────────────────────────────── */

export interface MonthCell {
  readonly iso: string;
  readonly date: PlainDate;
  readonly label: string;
  readonly count: string;
  readonly tabIndex: number;
  readonly today: boolean;
  readonly outside: boolean;
  readonly nonWorking: boolean;
  readonly selected: boolean;
  readonly events: readonly EventView[];
  readonly continuations: readonly string[];
  readonly more: number;
  readonly moreLabel: string;
}

export interface MonthRow {
  readonly key: string;
  readonly weekNumber: number;
  readonly cells: readonly MonthCell[];
}

export interface MonthDrawing {
  readonly weekdays: readonly { key: string; short: string; long: string }[];
  readonly rows: readonly MonthRow[];
}

export function drawMonth(
  input: DrawingInput,
  weeks: readonly (readonly PlainDate[])[],
  occurrences: readonly EventOccurrence[],
): MonthDrawing {
  const first = weeks[0] ?? [];
  return {
    weekdays: first.map((date) => ({
      key: toISODate(date),
      short: weekday(input.locale, date, 'short'),
      long: weekday(input.locale, date, 'long'),
    })),
    rows: weeks.map((week) => {
      const { segments } = layoutRow(occurrences, week, {});
      const hidden = overflowByDay(segments, week.length, input.maxEvents);
      return {
        key: toISODate(week[0] as PlainDate),
        weekNumber: isoWeekNumber(week[0] as PlainDate),
        cells: week.map((date, index) => {
          const shown = segments.filter(
            (segment) => segment.start === index && segment.lane < input.maxEvents,
          );
          const continuing = segments.filter(
            (segment) =>
              segment.start < index &&
              segment.start + segment.span > index &&
              segment.lane < input.maxEvents,
          );
          const more = hidden[index] ?? 0;
          return {
            iso: toISODate(date),
            date,
            label: fullDate(input.locale, date),
            count: input.t('events', { count: occurrencesOn(occurrences, date).length }),
            tabIndex: isSameDate(date, input.date) ? 0 : -1,
            today: input.today !== null && isSameDate(date, input.today),
            outside: date.month !== input.date.month,
            nonWorking: !isWorkingDay(date, input.workingHours),
            selected: holdsDay(input.selection, date),
            events: shown.map((segment) => {
              const bar = segment.occurrence.allDay || isMultiDay(segment.occurrence);
              return eventView(input, segment.occurrence, date, bar ? 'bar' : 'lane', {
                continuesBefore: segment.continuesBefore,
                continuesAfter: segment.continuesAfter,
                style: bar
                  ? {
                      '--slotted-event-lane': segment.lane + 1,
                      '--slotted-event-span': segment.span,
                    }
                  : { '--slotted-event-lane': segment.lane + 1 },
              });
            }),
            continuations: continuing.map((segment) =>
              input.t('titleContinues', { title: segment.occurrence.event.title }),
            ),
            more,
            moreLabel: input.t('moreEvents', { count: more }),
          };
        }),
      };
    }),
  };
}

/* ── The time grid ─────────────────────────────────────────────────────── */

export interface ColumnHeader {
  readonly iso: string;
  readonly date: PlainDate;
  readonly weekday: string;
  readonly label: string;
  readonly tabIndex: number;
  readonly today: boolean;
  readonly offsetShort: string | null;
  readonly offsetLong: string | null;
}

export interface AllDayCell {
  readonly iso: string;
  readonly date: PlainDate;
  readonly tabIndex: number;
  readonly today: boolean;
  readonly nonWorking: boolean;
  readonly selected: boolean;
  readonly events: readonly EventView[];
  readonly continuations: readonly string[];
}

export interface ColumnMoreView {
  readonly count: number;
  /** One column: a count laid over the events it hides, not a column. */
  readonly overlay: boolean;
  readonly label: string;
  readonly style: Record<string, number>;
}

export interface ColumnView {
  readonly iso: string;
  readonly date: PlainDate;
  readonly tabIndex: number;
  readonly today: boolean;
  readonly nonWorking: boolean;
  readonly offHours: readonly Record<string, number>[];
  readonly offsetLine: Record<string, number> | null;
  readonly selection: { style: Record<string, number>; text: string } | null;
  readonly items: readonly EventView[];
  readonly more: readonly ColumnMoreView[];
  readonly now: Record<string, number> | null;
}

export interface TimeGridDrawing {
  readonly days: number;
  readonly zone: string;
  readonly lanes: number;
  readonly hours: readonly { hour: number; label: string }[];
  readonly headers: readonly ColumnHeader[];
  readonly allDay: readonly AllDayCell[];
  readonly columns: readonly ColumnView[];
}

export function drawTimeGrid(
  input: DrawingInput,
  days: readonly PlainDate[],
  occurrences: readonly EventOccurrence[],
): TimeGridDrawing {
  const [startHour, endHour] = input.dayHours;
  const options = { locale: input.locale, hourCycle: input.hourCycle };
  const { segments, lanes } = layoutRow(occurrences, days, { allDayOnly: true });
  const isToday = (date: PlainDate) => input.today !== null && isSameDate(date, input.today);
  const tabDay = (date: PlainDate) => isSameDate(date, input.date);
  const selection = input.selection;

  return {
    days: days.length,
    zone: zoneLabel(days[0] as PlainDate, input.timeZone, input.locale),
    lanes: Math.max(1, lanes),
    hours: Array.from({ length: Math.max(0, endHour - startHour) }, (_, index) => ({
      hour: startHour + index,
      label: formatHour(startHour + index, options),
    })),
    headers: days.map((date) => {
      const change = offsetChangeOn(date, input.timeZone);
      const slots =
        change === null
          ? null
          : {
              direction: change.minutes > 0 ? 'forward' : 'back',
              hours: Math.abs(change.minutes) / 60,
              at: formatTime(change.at, options),
            };
      return {
        iso: toISODate(date),
        date,
        weekday: weekday(input.locale, date, 'short'),
        label: fullDate(input.locale, date),
        tabIndex: input.row === 'header' && tabDay(date) ? 0 : -1,
        today: isToday(date),
        offsetShort: slots === null ? null : input.t('offsetChangeShort', slots),
        offsetLong: slots === null ? null : input.t('offsetChange', slots),
      };
    }),
    allDay: days.map((date, index) => ({
      iso: toISODate(date),
      date,
      tabIndex: input.row === 'all-day' && tabDay(date) ? 0 : -1,
      today: isToday(date),
      nonWorking: !isWorkingDay(date, input.workingHours),
      selected: holdsDay(selection, date),
      events: segments
        .filter((segment) => segment.start === index)
        .map((segment) =>
          eventView(input, segment.occurrence, date, 'bar', {
            continuesBefore: segment.continuesBefore,
            continuesAfter: segment.continuesAfter,
            style: {
              '--slotted-event-lane': segment.lane + 1,
              '--slotted-event-span': segment.span,
            },
          }),
        ),
      continuations: segments
        .filter((segment) => segment.start < index && segment.start + segment.span > index)
        .map((segment) => input.t('titleContinues', { title: segment.occurrence.event.title })),
    })),
    columns: days.map((date) => {
      const { items, more } = layoutColumn(occurrences, date, {
        startHour,
        endHour,
        maxColumns: input.maxColumns,
        minLength: MIN_BLOCK_MINUTES,
      });
      const change = offsetChangeOn(date, input.timeZone);
      const now =
        input.now !== null && isSameDate(input.now.date, date) ? minutesOf(input.now) : null;
      const timed =
        selection !== null &&
        isPlainDateTime(selection.start) &&
        isSameDate(selection.start.date, date)
          ? (selection as { start: PlainDateTime; end: PlainDateTime })
          : null;
      return {
        iso: toISODate(date),
        date,
        tabIndex: input.row === 'timed' && tabDay(date) ? 0 : -1,
        today: isToday(date),
        nonWorking: !isWorkingDay(date, input.workingHours),
        offHours: offHoursOn(date, input.workingHours, { startHour, endHour }).map((entry) => ({
          '--slotted-event-start': entry.start,
          '--slotted-event-length': entry.length,
        })),
        offsetLine:
          change === null
            ? null
            : { '--slotted-event-start': change.at.hour * 60 + change.at.minute - startHour * 60 },
        selection:
          timed === null
            ? null
            : {
                style: {
                  '--slotted-event-start': minutesOf(timed.start) - startHour * 60,
                  '--slotted-event-length':
                    (isSameDate(timed.end.date, date) ? minutesOf(timed.end) : 1440) -
                    minutesOf(timed.start),
                },
                text: formatTimeRange(timed.start.time, timed.end.time, options),
              },
        items: items.map((item) =>
          eventView(input, item.occurrence, date, 'block', {
            continuesBefore: item.continuesBefore,
            continuesAfter: item.continuesAfter,
            clippedStart: item.clippedStart,
            clippedEnd: item.clippedEnd,
            short: item.length < SHORT_MINUTES,
            withLocation: item.length >= SHORT_MINUTES,
            style: {
              '--slotted-event-start': item.start,
              '--slotted-event-length': item.length,
              '--slotted-event-column': item.column,
              '--slotted-event-columns': item.columns,
              '--slotted-event-span': item.span,
            },
          }),
        ),
        more: more.map((entry) => ({
          count: entry.occurrences.length,
          overlay: entry.overlay,
          label: input.t('moreEvents', { count: entry.occurrences.length }),
          style: {
            '--slotted-event-start': entry.start,
            '--slotted-event-length': entry.length,
            '--slotted-event-column': entry.column,
            '--slotted-event-columns': entry.columns,
            '--slotted-event-span': 1,
          },
        })),
        now:
          now === null || now < startHour * 60 || now > endHour * 60
            ? null
            : { '--slotted-event-start': now - startHour * 60 },
      };
    }),
  };
}

/* ── The list ──────────────────────────────────────────────────────────── */

export interface ListDayView {
  readonly iso: string;
  readonly headingId: string;
  readonly heading: { readonly weekday: string; readonly date: string; readonly label: string };
  readonly today: boolean;
  readonly events: readonly EventView[];
}

export function drawList(
  input: DrawingInput,
  days: readonly PlainDate[],
  occurrences: readonly EventOccurrence[],
): readonly ListDayView[] {
  return listDays(occurrences, days).map((day) => ({
    iso: toISODate(day.date),
    headingId: `${input.id}-list-${toISODate(day.date)}`,
    heading: listDayParts(day.date, input.locale),
    today: input.today !== null && isSameDate(day.date, input.today),
    events: day.occurrences.map((occurrence) =>
      eventView(input, occurrence, day.date, 'list', { withLocation: true }),
    ),
  }));
}
