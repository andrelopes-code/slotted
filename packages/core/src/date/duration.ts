/**
 * A time written as a duration from somewhere, and the resolution of one.
 *
 * Every surveyed time picker offers a list of instants and leaves "forty
 * minutes from now" to the reader's own arithmetic. This is the module behind
 * the entry that does not:  the reader writes `+40m` and sees `15:20` before
 * anything commits.
 *
 * The grammar is symbols and unit letters rather than the locale's own words.
 * `+40m` works on every keyboard in every language; `daqui a 40 minutos` would
 * work in one and none of the others, and a half-translated grammar is worse
 * than a stated one. The placeholder says what the field takes.
 *
 * Nothing here touches the DOM or a framework.
 */

import { addDateTimeSeconds } from './plain-date-time';
import type { PlainDateTime } from './plain-date-time';
import { addSeconds } from './plain-time';
import type { PlainTime, TimeStep } from './plain-time';

/** The keys that open an expression, in place of the segments. */
const RELATIVE_KEYS = ['+', '-', '='];

/** `1:30` and `1:30:15`, and nothing with a fourth field. */
const COLON_FORM = /^(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$/;
/** One run of digits and the unit letter that may follow it. */
const TOKEN = /(\d+)([wdhms]?)/y;

/**
 * The five units, and the three of them a time alone can mean.
 *
 * `time-field` opened this grammar with `h`, `m` and `s`, because a `PlainTime`
 * has no day for `d` to move. `datetime-field` has one, so it states the wider
 * set — and the widening is **additive**: the default here is still the three,
 * so every expression `time-field` parsed parses the same way and a `d` typed
 * into a `time-field` is refused there exactly as it was before.
 */
export type DurationUnit = 'w' | 'd' | 'h' | 'm' | 's';

/** The units a time alone can mean. */
export const TIME_UNITS: readonly DurationUnit[] = ['h', 'm', 's'];
/** The units a datetime can mean. */
export const DATE_TIME_UNITS: readonly DurationUnit[] = ['w', 'd', 'h', 'm', 's'];

const SECONDS: Record<DurationUnit, number> = {
  w: 604_800,
  d: 86_400,
  h: 3600,
  m: 60,
  s: 1,
};
/** What a bare number means after each unit: one step further down. */
const NEXT_DOWN: Record<DurationUnit, DurationUnit | null> = {
  w: 'd',
  d: 'h',
  h: 'm',
  m: 's',
  s: null,
};
const ORDER: Record<DurationUnit, number> = { w: 5, d: 4, h: 3, m: 2, s: 1 };

export interface DurationOptions {
  /**
   * Which unit letters the expression may use. Defaults to `TIME_UNITS`, so a
   * caller that does not state the wider set keeps the grammar it had.
   */
  readonly units?: readonly DurationUnit[] | undefined;
}

export function isRelativeKey(key: string): boolean {
  return RELATIVE_KEYS.includes(key);
}

/**
 * Reads an expression into signed seconds, or `null` while it says nothing.
 *
 * `null` is the answer for an unfinished expression as much as for a wrong
 * one, and the difference does not matter to the caller: both leave the preview
 * empty and both refuse `Enter`. Reading `+` as zero would commit "now" on the
 * keystroke that opened the field.
 */
export function parseDuration(text: string, options: DurationOptions = {}): number | null {
  const units = options.units ?? TIME_UNITS;
  const cleaned = text.trim().toLowerCase().replace(/\s+/g, '');
  if (cleaned === '') return null;

  /* `=` is the whole expression, not a sign: it is "now", and the panel's own
     control writes the same zero. */
  if (cleaned === '=') return 0;

  const sign = cleaned.startsWith('-') ? -1 : 1;
  const body = cleaned.startsWith('+') || cleaned.startsWith('-') ? cleaned.slice(1) : cleaned;
  if (body === '') return null;

  const colons = COLON_FORM.exec(body);
  if (colons !== null) {
    const [, hours, minutes, seconds] = colons as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];
    return sign * (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds ?? 0));
  }

  /* A lone colon, or one with nothing after it, is an unfinished colon form
     rather than a run of digits with a stray character. */
  if (body.includes(':')) return null;

  let total = 0;
  let index = 0;
  let previous: DurationUnit | null = null;

  while (index < body.length) {
    TOKEN.lastIndex = index;
    const token = TOKEN.exec(body);
    if (token === null) return null;

    const [whole, digits, letter] = token as unknown as [string, string, string];
    /* A letter the caller did not allow is not a unit, and the expression is
       refused whole rather than read as the part before it. */
    if (letter !== '' && !units.includes(letter as DurationUnit)) return null;
    const unit: DurationUnit | null =
      letter === '' ? (previous === null ? 'm' : NEXT_DOWN[previous]) : (letter as DurationUnit);

    /* A bare number after seconds has no unit below it to mean, and a unit
       written above the one before it — `30m1h` — is two durations rather than
       one. Both are refused instead of being added anyway. A bare number that
       would fall to a unit the caller did not allow is refused for the same
       reason: `1w30` in a grammar without days means nothing. */
    if (unit === null || !units.includes(unit)) return null;
    if (previous !== null && ORDER[unit] >= ORDER[previous]) return null;

    total += Number(digits) * SECONDS[unit];
    previous = unit;
    index += whole.length;
  }

  return sign * total;
}

/**
 * Where an expression lands, and how many midnights it crossed to get there.
 *
 * The crossing is the fact no surveyed implementation states: `+90m` at 23:00
 * is 00:30 the next day, and a library holding only a wall-clock time has to
 * say so rather than quietly answer 00:30.
 */
export function resolveRelative(anchor: PlainTime, seconds: number): TimeStep {
  return addSeconds(anchor, seconds);
}

/**
 * The same expression against a whole datetime.
 *
 * This is where `crossesMidnight` is spent. `time-field` raises the flag
 * because a `PlainTime` has no day to put the crossing in, and names
 * `datetime-field` as the consumer that would answer it; here the day exists,
 * so the crossing is not a flag beside the value — it is the value.
 */
export function resolveRelativeDateTime(anchor: PlainDateTime, seconds: number): PlainDateTime {
  return addDateTimeSeconds(anchor, seconds);
}
