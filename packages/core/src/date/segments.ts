/**
 * The entry model of a segmented date field: what a typed digit, a stepped
 * arrow and an emptied segment do to a date the reader is halfway through.
 *
 * It is separate from the value because a half-typed date is not a date. Every
 * surveyed segmented field holds either a whole date or nothing, so a day and
 * a month with no year is a state none of them can name; here the segments are
 * the state and the value is derived, `null` until all three are filled. That
 * is what lets a consumer save a draft, and what makes "empty" and "being
 * typed" two different things in the DOM.
 *
 * Nothing here touches the DOM or a framework.
 */

import { fieldRange } from './format';
import type { DateFieldName, SegmentFieldName } from './format';
import { daysInMonth, plainDate } from './plain-date';
import type { PlainDate } from './plain-date';
import { plainTime } from './plain-time';
import type { PlainTime } from './plain-time';
import type { HourCycle, TimeFormat } from './time-format';

/** The date fields, named once so the day rules can ask which half a field is in. */
const DATE_FIELDS: readonly DateFieldName[] = ['year', 'month', 'day'];

function isDateField(field: SegmentFieldName): field is DateFieldName {
  return (DATE_FIELDS as readonly string[]).includes(field);
}

/**
 * Where an empty segment steps from, and which cycle the hour is drawn in.
 *
 * Every time field is optional and a `PlainDate` is assignable to this, so the
 * date chain's own call sites compile unchanged. `reference[field]` is what an
 * empty segment steps to, and it answers all seven fields from one object.
 */
export interface SegmentReference extends PlainDate {
  readonly hour?: number | undefined;
  readonly minute?: number | undefined;
  readonly second?: number | undefined;
  readonly dayPeriod?: number | undefined;
  readonly hourCycle?: HourCycle | undefined;
}

/**
 * What the entry model needs of a format, and no more.
 *
 * `DateFormat` and `TimeFormat` both satisfy it, which is what lets one engine
 * take a typed digit for either half without knowing which half it is in.
 */
export interface SegmentFormat {
  widthOf(field: SegmentFieldName): number;
  /** Only a date format has one, and only the year field asks for it. */
  resolveYear?(typed: number): number;
}

/** What `segmentsOfTime` needs of a time format, and no more. */
export type TimeDisplay = Pick<TimeFormat, 'toDisplay'>;

/** What `timeOf` needs of a time format, and no more. */
export type TimeValueFormat = Pick<TimeFormat, 'granularity' | 'usesDayPeriod' | 'fromDisplay'>;

/** What `typeDayPeriod` needs of a time format, and no more. */
export type DayPeriodNames = Pick<TimeFormat, 'dayPeriodNames'>;

export interface SegmentState {
  readonly year: number | null;
  readonly month: number | null;
  readonly day: number | null;
  /**
   * The hour as the reader sees it, which is not always the hour a `PlainTime`
   * holds: a twelve-hour locale draws 2 beside PM where the value is 14, and
   * `timeOf` is the one place the two are reconciled.
   */
  readonly hour: number | null;
  readonly minute: number | null;
  readonly second: number | null;
  /** `0` for the first period of the day, `1` for the second. */
  readonly dayPeriod: number | null;
  /**
   * The field being typed into and how many digits have gone in. A run ends
   * when the reader moves, steps, or fills the field.
   */
  readonly typing: { readonly field: SegmentFieldName; readonly digits: number } | null;
  /**
   * The day the reader last asked for, kept across a month that could not hold
   * it, so stepping January's 31st forward and back returns 31 rather than 28.
   */
  readonly intendedDay: number | null;
}

export const EMPTY_SEGMENTS: SegmentState = {
  year: null,
  month: null,
  day: null,
  hour: null,
  minute: null,
  second: null,
  dayPeriod: null,
  typing: null,
  intendedDay: null,
};

export function segmentsOf(date: PlainDate | null): SegmentState {
  if (date === null) return EMPTY_SEGMENTS;
  return {
    ...EMPTY_SEGMENTS,
    year: date.year,
    month: date.month,
    day: date.day,
    intendedDay: date.day,
  };
}

/**
 * The segments a time fills, in the shape the reader sees them.
 *
 * The hour is the display hour and the day period beside it, so what is held
 * is what is drawn: 14:30 is `2` and PM in `en-US`, `2` and PM in `ja-JP`
 * under `h11`, and `14` with no period in `pt-BR`.
 */
export function segmentsOfTime(time: PlainTime | null, format: TimeDisplay): SegmentState {
  if (time === null) return EMPTY_SEGMENTS;
  const shown = format.toDisplay(time.hour);
  return {
    ...EMPTY_SEGMENTS,
    hour: shown.hour,
    minute: time.minute,
    second: time.second,
    dayPeriod: shown.dayPeriod,
  };
}

/** The date the segments make, or `null` while any of them is unfilled. */
export function dateOf(segments: SegmentState): PlainDate | null {
  const { year, month, day } = segments;
  if (year === null || month === null || day === null) return null;
  if (year < 1 || month < 1 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  try {
    return plainDate(year, month, day);
  } catch {
    return null;
  }
}

export function isComplete(segments: SegmentState): boolean {
  return dateOf(segments) !== null;
}

/**
 * The time the segments make, or `null` while any field the format draws is
 * unfilled.
 *
 * "Any field the format draws" is what makes an hour-granularity field
 * complete with an hour alone and a twelve-hour field incomplete without its
 * day period. A field the reader never sees is never a reason to withhold a
 * value.
 */
export function timeOf(segments: SegmentState, format: TimeValueFormat): PlainTime | null {
  const { hour, minute, second, dayPeriod } = segments;
  if (hour === null) return null;
  if (format.granularity !== 'hour' && minute === null) return null;
  if (format.granularity === 'second' && second === null) return null;
  if (format.usesDayPeriod && dayPeriod === null) return null;

  try {
    return plainTime(format.fromDisplay(hour, dayPeriod), minute ?? 0, second ?? 0);
  } catch {
    return null;
  }
}

export function isTimeComplete(segments: SegmentState, format: TimeValueFormat): boolean {
  return timeOf(segments, format) !== null;
}

/** How wide a field's range is, given what is known around it. */
function rangeFor(field: SegmentFieldName, segments: SegmentState, reference: SegmentReference) {
  return fieldRange(field, {
    year: segments.year ?? reference.year,
    month: segments.month ?? reference.month,
    hourCycle: reference.hourCycle,
  });
}

/**
 * Steps one segment, wrapping inside it and never carrying into the next — the
 * rule the APG's spin-button example states: December steps up to January and
 * the month does not move to the following year.
 *
 * An empty segment takes the reference date's own value rather than a minimum,
 * because a reader pressing Down on an empty year wants a year near this one,
 * not the year 1.
 */
export function stepSegment(
  segments: SegmentState,
  field: SegmentFieldName,
  by: number,
  reference: SegmentReference,
): SegmentState {
  const { min, max } = rangeFor(field, segments, reference);
  const current = segments[field];

  let next: number;
  if (current === null) {
    /* A reference that says nothing about a field steps it to its own floor,
       which is what a time field with no clock behind it has to fall back to. */
    next = reference[field] ?? min;
  } else if (field === 'year') {
    /* A year does not wrap: there is no year after 9999 that a reader means. */
    next = Math.min(max, Math.max(min, current + by));
  } else {
    const span = max - min + 1;
    next = ((((current - min + by) % span) + span) % span) + min;
  }

  const stepped = { ...segments, [field]: next, typing: null } as SegmentState;
  return withDayHeld(stepped, field, reference);
}

/** Moves a segment to the lowest or highest value it can hold. */
export function boundSegment(
  segments: SegmentState,
  field: SegmentFieldName,
  edge: 'min' | 'max',
  reference: SegmentReference,
): SegmentState {
  const range = rangeFor(field, segments, reference);
  const bounded = { ...segments, [field]: range[edge], typing: null } as SegmentState;
  return withDayHeld(bounded, field, reference);
}

/**
 * Keeps the day the reader asked for when the month or the year moved under it.
 * February pulls a 31 back to 28; March gives it back. Discarded whenever the
 * reader states a day themselves, because that is a new intention.
 */
function withDayHeld(
  segments: SegmentState,
  changed: SegmentFieldName,
  reference: SegmentReference,
): SegmentState {
  /* A stepped hour has no day to hold. The rule is the date half's alone. */
  if (!isDateField(changed)) return segments;
  if (changed === 'day') return { ...segments, intendedDay: segments.day };
  const wanted = segments.intendedDay ?? segments.day;
  if (wanted === null || segments.day === null) return segments;

  const month = segments.month ?? reference.month;
  /* A month outside the year has no length, and clamping against the nought
     `daysInMonth` would answer with is how a finished day became `00`. */
  if (month < 1 || month > 12) return segments;

  const length = daysInMonth(segments.year ?? reference.year, month);
  return { ...segments, day: Math.min(wanted, length), intendedDay: wanted };
}

export interface TypedDigit {
  readonly segments: SegmentState;
  /** The segment can hold no further digit, so focus moves to the next one. */
  readonly advance: boolean;
}

/**
 * Takes one typed digit.
 *
 * Typing `3` into a month waits, because `30` is not a month but `03` needs no
 * wait; typing `4` after it would be `34`, so the `4` starts a new run and the
 * segment advances. The rule is arithmetic rather than a table: a run ends when
 * the field is full, or when one more digit could not fit under the maximum.
 */
export function typeDigit(
  segments: SegmentState,
  field: SegmentFieldName,
  digit: number,
  format: SegmentFormat,
  reference: SegmentReference,
): TypedDigit {
  const { max } = rangeFor(field, segments, reference);
  const width = format.widthOf(field);
  const run = segments.typing?.field === field ? segments.typing.digits : 0;
  const held = run === 0 ? 0 : (segments[field] ?? 0);

  let next = held * 10 + digit;
  let digits = run + 1;
  if (next > max) {
    next = digit;
    digits = 1;
  }

  const advance = digits >= width || next * 10 > max;
  const typed = {
    ...segments,
    [field]: next,
    typing: advance ? null : { field, digits },
  } as SegmentState;

  /**
   * The held day is applied when the run ends, never inside it.
   *
   * A month halfway through being typed is not a month: the first digit of
   * `03` is `0`, and clamping the day against it asked `daysInMonth` for the
   * length of month zero. Typing `03` over a day of 15 turned the day into
   * `00` and then back into `15` — the reader watched a field they had already
   * finished collapse under them, which is what a real browser showed and a
   * jsdom spec did not.
   */
  return { segments: advance ? withDayHeld(typed, field, reference) : typed, advance };
}

/**
 * Ends a typing run. A year left with fewer than four digits is resolved
 * through the format's own pivot, so `26` becomes 2026 by a rule the contract
 * states rather than by a guess made twice in two bindings.
 */
export function commitTyping(
  segments: SegmentState,
  format: SegmentFormat,
  reference?: SegmentReference,
): SegmentState {
  const typing = segments.typing;
  if (typing === null) return segments;

  const resolved =
    typing.field === 'year' && segments.year !== null && typing.digits <= 2
      ? { ...segments, year: format.resolveYear?.(segments.year) ?? segments.year, typing: null }
      : { ...segments, typing: null };

  /* The run has ended, so the held day is applied now — this is the other half
     of the rule `typeDigit` defers. */
  return reference === undefined ? resolved : withDayHeld(resolved, typing.field, reference);
}

/** Empties one segment back to its placeholder. */
export function clearSegment(segments: SegmentState, field: SegmentFieldName): SegmentState {
  const cleared = { ...segments, [field]: null, typing: null } as SegmentState;
  return field === 'day' ? { ...cleared, intendedDay: null } : cleared;
}

/**
 * Takes one letter into the day period.
 *
 * Digits do not reach this field: it holds two values whose names are words,
 * so the platform's own rule is the one taken — the first letter of either
 * name chooses it. `null` says the letter was neither, and the caller leaves
 * the segment alone rather than emptying it.
 */
export function typeDayPeriod(
  segments: SegmentState,
  letter: string,
  format: DayPeriodNames,
): TypedDigit | null {
  const typed = letter.toLowerCase();
  const index = format
    .dayPeriodNames()
    .findIndex((name) => name !== '' && name.charAt(0).toLowerCase() === typed);
  if (index < 0) return null;
  return { segments: { ...segments, dayPeriod: index, typing: null }, advance: true };
}
