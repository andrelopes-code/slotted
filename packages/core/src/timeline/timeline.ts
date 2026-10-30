/**
 * What a timeline knows about itself, resolved once for both bindings.
 *
 * Five questions: what a timestamp is written and read as, which events are
 * finished when the consumer has only said which one is current, which side
 * of the rail an event takes, where a feed key moves focus, and how large a
 * feed says it is. Each of them is a rule two bindings would write twice and
 * get wrong in different ways — the timestamp most of all, because a value
 * with a zone and a value without one are two different things that look the
 * same in a string.
 *
 * Nothing here touches the DOM or a framework.
 */

import { isPlainDateTime, parseISODateTime, toISODateTime } from '../date/plain-date-time';
import type { PlainDateTime } from '../date/plain-date-time';

export type TimelineOrder = 'oldest-first' | 'newest-first';
export type TimelinePlacement = 'end' | 'start' | 'alternate';
export type TimelineSide = 'start' | 'end';
export type TimelineTimeFormat = 'absolute' | 'relative';
export type TimelineGrowing = 'none' | 'button' | 'scroll';
export type TimelineConnector = 'solid' | 'dashed' | 'none';

/**
 * What a `time` part accepts: the wall-clock value the date chain holds, or an
 * ISO 8601 string — with a zone designator, an instant; without one, the same
 * wall-clock value written out.
 */
export type TimestampValue = PlainDateTime | string;

/** `Z`, or an offset, at the end of an ISO string. */
const ZONE_DESIGNATOR = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Whether a string names an instant. `2026-09-14T10:32:00Z` is a moment on
 * every clock; `2026-09-14T10:32` is ten thirty-two on the reader's, and the
 * two are formatted by different rules.
 */
export function isInstant(value: string): boolean {
  return ZONE_DESIGNATOR.test(value.trim());
}

export interface Timestamp {
  /** What goes into `datetime`: the string as given, or the ISO of the value. */
  readonly dateTime: string;
  /** The instant, in epoch milliseconds, or `null` for a wall-clock value. */
  readonly epoch: number | null;
  /** The wall-clock value, or `null` for an instant. */
  readonly plain: PlainDateTime | null;
}

/**
 * The two readings of a value, decided once. An unparseable string is kept
 * as `datetime` and formatted as itself: the platform reads what it can, and
 * the reader sees what the consumer wrote rather than an error.
 */
export function timestampOf(value: TimestampValue): Timestamp {
  if (isPlainDateTime(value)) {
    return { dateTime: toISODateTime(value), epoch: null, plain: value };
  }
  const text = value.trim();
  if (isInstant(text)) {
    const epoch = Date.parse(text);
    return { dateTime: text, epoch: Number.isNaN(epoch) ? null : epoch, plain: null };
  }
  return { dateTime: text, epoch: null, plain: parseISODateTime(text) };
}

export interface FormatTimestampOptions {
  /** BCP 47. Defaults to the runtime's own resolved locale. */
  locale?: string | undefined;
  /**
   * The zone an instant is written in, and the zone a wall-clock value is
   * measured against for a relative reading. Defaults to the runtime's own.
   */
  timeZone?: string | undefined;
  format?: TimelineTimeFormat | undefined;
  /**
   * The moment a relative reading counts from, in epoch milliseconds. Defaults
   * to the clock at the call, which is the cost written in the design for a
   * page rendered on a server: pass it once, from the defaults.
   */
  now?: number | undefined;
  /** How an absolute reading is written. Defaults to a medium date and a short time. */
  absolute?: Intl.DateTimeFormatOptions | undefined;
}

export interface FormattedTimestamp {
  readonly dateTime: string;
  /** What the reader sees. */
  readonly text: string;
  /** The absolute reading behind a relative one, for `title`; absent otherwise. */
  readonly title: string | null;
}

const DEFAULT_ABSOLUTE: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

/** A wall-clock value as the epoch it would be in UTC: the number `Date.UTC` gives. */
function plainAsUTC(plain: PlainDateTime): number {
  return Date.UTC(
    plain.date.year,
    plain.date.month - 1,
    plain.date.day,
    plain.time.hour,
    plain.time.minute,
    plain.time.second,
  );
}

/** The wall clock in `timeZone` at `epoch`, as the number `Date.UTC` would give it. */
function wallClockAt(epoch: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epoch));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour') % 24,
    read('minute'),
    read('second'),
  );
}

/**
 * The instant a wall-clock value names in a zone. Two passes: the first
 * guesses the offset at the wall clock read as UTC, the second corrects it
 * at the instant the first pass found, which is what a daylight boundary
 * needs. Without a zone, the runtime's own.
 */
export function zonedEpoch(plain: PlainDateTime, timeZone?: string | undefined): number {
  if (timeZone === undefined) {
    return new Date(
      plain.date.year,
      plain.date.month - 1,
      plain.date.day,
      plain.time.hour,
      plain.time.minute,
      plain.time.second,
    ).getTime();
  }
  const asUTC = plainAsUTC(plain);
  let guess = asUTC;
  for (let pass = 0; pass < 2; pass += 1) {
    guess = asUTC - (wallClockAt(guess, timeZone) - guess);
  }
  return guess;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export interface RelativeReading {
  readonly unit: Intl.RelativeTimeFormatUnit;
  /** Signed: negative for the past. */
  readonly value: number;
}

/**
 * The largest unit that holds a whole step of the distance, in the order a
 * reader counts: seconds under a minute, minutes under an hour, hours under a
 * day, days under a week, weeks under a month, months under a year.
 */
export function relativeUnit(distance: number): RelativeReading {
  const magnitude = Math.abs(distance);
  const sign = distance < 0 ? -1 : 1;
  const steps: readonly [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', YEAR],
    ['month', MONTH],
    ['week', WEEK],
    ['day', DAY],
    ['hour', HOUR],
    ['minute', MINUTE],
  ];
  for (const [unit, size] of steps) {
    if (magnitude >= size) return { unit, value: sign * Math.floor(magnitude / size) };
  }
  return { unit: 'second', value: sign * Math.floor(magnitude / SECOND) };
}

/**
 * One value, read two ways. An instant is written in the zone given; a
 * wall-clock value is written as it is, with no conversion, which is what the
 * date chain promises for the value it holds. The relative reading counts
 * from `now` and keeps the absolute one for `title`.
 */
export function formatTimestamp(
  value: TimestampValue,
  options: FormatTimestampOptions = {},
): FormattedTimestamp {
  const stamp = timestampOf(value);
  const { locale, timeZone } = options;
  const absoluteOptions = options.absolute ?? DEFAULT_ABSOLUTE;

  let absolute: string;
  let epoch: number | null;
  if (stamp.plain !== null) {
    absolute = new Intl.DateTimeFormat(locale, { ...absoluteOptions, timeZone: 'UTC' }).format(
      new Date(plainAsUTC(stamp.plain)),
    );
    epoch = zonedEpoch(stamp.plain, timeZone);
  } else if (stamp.epoch !== null) {
    absolute = new Intl.DateTimeFormat(locale, {
      ...absoluteOptions,
      ...(timeZone === undefined ? {} : { timeZone }),
    }).format(new Date(stamp.epoch));
    epoch = stamp.epoch;
  } else {
    return { dateTime: stamp.dateTime, text: stamp.dateTime, title: null };
  }

  if (options.format !== 'relative') {
    return { dateTime: stamp.dateTime, text: absolute, title: null };
  }

  const now = options.now ?? Date.now();
  const reading = relativeUnit(epoch - now);
  const text = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    reading.value,
    reading.unit,
  );
  return { dateTime: stamp.dateTime, text, title: absolute };
}

export interface CompletionInput {
  /** The event being read, zero-based, in DOM order. */
  index: number;
  /** The event the consumer marked current, or `-1` for none. */
  currentIndex: number;
  order: TimelineOrder;
  /** Whether the consumer marked this event finished. */
  complete?: boolean | undefined;
  /**
   * Whether the events on the past side of the current one are finished. Off
   * by default: a list that reaches "in transit" has not said "packed" is
   * done, and a family that assumed otherwise would report work as done that
   * never was — the rule `stepper` holds for the same word.
   */
  autoComplete?: boolean | undefined;
}

/**
 * Where the past is. In `oldest-first` it is before the current event in DOM
 * order; in `newest-first`, after it. This is the whole reason the order is
 * declared rather than the array reversed.
 */
export function isPast({ index, currentIndex, order }: Omit<CompletionInput, 'complete'>) {
  if (currentIndex < 0 || index === currentIndex) return false;
  return order === 'oldest-first' ? index < currentIndex : index > currentIndex;
}

/** The consumer's word first, then the derivation, then nothing. */
export function isComplete(input: CompletionInput): boolean {
  if (input.complete !== undefined) return input.complete;
  if (input.autoComplete !== true) return false;
  return isPast(input);
}

export interface ConnectorInput {
  index: number;
  currentIndex: number;
  order: TimelineOrder;
  /** The consumer's own word for this event's connector, when stated. */
  connector?: TimelineConnector | undefined;
  autoComplete?: boolean | undefined;
}

/**
 * The connector after an event, in DOM order, runs into the next one. With
 * `autoComplete` the connectors on the future side of the current event are
 * dashed: in `oldest-first` that is the current event's own connector and
 * every later one; in `newest-first` it is every connector before the current
 * event, because those run towards it from the future.
 */
export function connectorOf({
  index,
  currentIndex,
  order,
  connector,
  autoComplete,
}: ConnectorInput): TimelineConnector {
  if (connector !== undefined) return connector;
  if (autoComplete !== true || currentIndex < 0) return 'solid';
  const future = order === 'oldest-first' ? index >= currentIndex : index < currentIndex;
  return future ? 'dashed' : 'solid';
}

/**
 * Which side of the rail an event's body takes. `alternate` takes turns from
 * the first event, and a stated side wins.
 */
export function sideOf(
  placement: TimelinePlacement,
  index: number,
  side?: TimelineSide | undefined,
): TimelineSide {
  if (side !== undefined) return side;
  if (placement === 'start') return 'start';
  if (placement === 'alternate') return index % 2 === 1 ? 'start' : 'end';
  return 'end';
}

export interface SetSizeInput {
  /** The total the consumer states, when it knows it. */
  count?: number | undefined;
  /** How many events are loaded. */
  loaded: number;
  growing: TimelineGrowing;
}

/**
 * What `aria-setsize` says. The consumer's total when it has one; otherwise
 * the loaded count when the list will not grow, and `-1` when more may come —
 * the value ARIA reserves for a set whose size is unknown.
 */
export function setSizeOf({ count, loaded, growing }: SetSizeInput): number {
  if (count !== undefined && Number.isFinite(count)) return count;
  return growing === 'none' ? loaded : -1;
}

export type FeedFocusTarget = number | 'before' | 'after' | null;

export interface FeedFocusInput {
  /** The article focus is in, zero-based, or `-1` when it is elsewhere in the feed. */
  from: number;
  key: string;
  ctrlKey?: boolean | undefined;
  metaKey?: boolean | undefined;
  count: number;
}

/**
 * The APG Feed keys, transcribed: `PageDown` and `PageUp` move between
 * articles, `Control+End` and `Control+Home` leave the feed on either side.
 * `null` is a key the feed does not own, and the caller lets it through.
 */
export function feedFocusTarget({ from, key, ctrlKey, metaKey, count }: FeedFocusInput) {
  const modified = ctrlKey === true || metaKey === true;
  if (key === 'End' && modified) return 'after';
  if (key === 'Home' && modified) return 'before';
  if (key === 'PageDown') return from + 1 < count ? from + 1 : from >= 0 ? from : null;
  if (key === 'PageUp') return from > 0 ? from - 1 : from === 0 ? 0 : null;
  return null;
}

export interface RevealFocusInput {
  /** The events loaded once the reveal has rendered, groups that are closed left out. */
  loaded: number;
  /** How many events the pill held: the last count it showed. */
  revealed: number;
  order: TimelineOrder;
}

/**
 * Where focus lands when the fresh pill it was on hides: the first event the
 * reveal added. A newest-first list adds at the top; an oldest-first list
 * adds after the events already there. `null` is nothing to land on.
 */
export function revealFocusIndex({ loaded, revealed, order }: RevealFocusInput): number | null {
  if (loaded <= 0 || revealed <= 0) return null;
  return order === 'newest-first' ? 0 : Math.max(0, loaded - revealed);
}
