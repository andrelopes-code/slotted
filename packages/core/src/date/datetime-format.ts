/**
 * Reading and writing one datetime, in one locale.
 *
 * It is **one** `Intl.DateTimeFormat` over both halves rather than two
 * formatters side by side, and that is the whole reason `datetime-field` draws
 * its own row instead of nesting `date-field` beside `time-field`. Three things
 * only the combined call can say:
 *
 * - **the order of the halves.** `ja-JP` writes `2026/09/10 15:20` and some
 *   locales put the time first. Two independent formatters each know their own
 *   order and neither knows which comes first.
 * - **the literal between them.** `en-US` writes `, ` and `pt-BR` writes a
 *   space. It belongs to neither half.
 * - **where the day period lands.** `ja-JP` under the twelve-hour axis writes
 *   it *before* the hour.
 *
 * Everything a single field needs — its width, its digits, its placeholder, the
 * day-period names, the display hour, the two parsers, the year pivot — is
 * delegated to the `DateFormat` and `TimeFormat` this holds. Neither of those
 * modules is touched.
 *
 * Nothing here touches the DOM or a framework.
 */

import { createDateFormat } from './format';
import {
  dateOf,
  EMPTY_SEGMENTS,
  isComplete,
  isTimeComplete,
  segmentsOf,
  segmentsOfTime,
  timeOf,
} from './segments';
import type { SegmentState } from './segments';
import type { DateFieldName, DateFormat, NameStyle, SegmentFieldName } from './format';
import { plainDateTime } from './plain-date-time';
import type { PlainDateTime } from './plain-date-time';
import type { PlainDate } from './plain-date';
import type { TimeGranularity } from './plain-time';
import { createTimeFormat, plainSpaces } from './time-format';
import type { DisplayHour, HourCycle, TimeFormat } from './time-format';

/** Which half of the value a field belongs to. */
export type DateTimeHalf = 'date' | 'time';

export interface DateTimePatternPart {
  readonly type: SegmentFieldName | 'literal';
  /** The separator, for a literal; the placeholder text, for a field. */
  readonly value: string;
  /** Which half the part belongs to. A boundary literal belongs to neither. */
  readonly half: DateTimeHalf | null;
  /**
   * The literal the locale writes *between* the two halves.
   *
   * It is drawn at the end of the first half rather than between the two, so a
   * wrap leaves it at the end of its line the way a comma in a sentence goes.
   * A boundary the locale writes as whitespace alone is not drawn at all — the
   * row's own column gap separates the halves instead — and `drawn` is how the
   * binding knows which of the two it has.
   */
  readonly boundary?: boolean;
  readonly drawn?: boolean;
}

export interface DateTimeFormatOptions {
  /** BCP 47. Defaults to the runtime's own resolved locale. */
  locale?: string | undefined;
  /**
   * The question a consumer asks. Which variant of each — `h11` or `h12`,
   * `h23` or `h24` — is the locale's own.
   */
  hourCycle?: 12 | 24 | undefined;
  /** How much of the time half is written. The date half is always whole. */
  granularity?: TimeGranularity | undefined;
  /** The pivot two typed year digits are resolved through. */
  yearPivot?: number | undefined;
  /** `0` is Sunday. Unset asks the locale. */
  firstDayOfWeek?: number | undefined;
}

export interface DateTimeFormat {
  readonly locale: string;
  readonly hourCycle: HourCycle;
  readonly granularity: TimeGranularity;
  /** The seven fields in the order the locale writes them, literals between. */
  readonly pattern: readonly DateTimePatternPart[];
  /** The ten digits this locale writes, in order. */
  readonly digits: readonly string[];
  /** Whether the resolved cycle draws a day period at all. */
  readonly usesDayPeriod: boolean;
  readonly firstDayOfWeek: number;
  /** The two halves, for a caller that needs one of them alone. */
  readonly date: DateFormat;
  readonly time: TimeFormat;
  /** Which half a field belongs to. */
  halfOf(field: SegmentFieldName): DateTimeHalf;
  /** How many digits each field is drawn with. */
  widthOf(field: SegmentFieldName): number;
  /** One field of a whole value, padded and in the locale's digits. */
  formatField(value: PlainDateTime, field: SegmentFieldName): string;
  /** One display value, padded and in the locale's digits. */
  formatValue(value: number, field: SegmentFieldName): string;
  /** The whole value in the locale's shape. */
  format(value: PlainDateTime): string;
  /** The locale's shape first, then ISO 8601. `null` when it is neither. */
  parse(text: string): PlainDateTime | null;
  /** The two day-period names this locale writes, first period first. */
  dayPeriodNames(): readonly [string, string];
  /** The whole value in words, which is what a screen reader is given. */
  describe(value: PlainDateTime): string;
  /** The date half in words, for the panel's own head. */
  describeDate(date: PlainDate, style?: NameStyle): string;
  toDisplay(hour: number): DisplayHour;
  fromDisplay(hour: number, dayPeriod: number | null): number;
  /** Resolves two typed digits into a year, through the pivot. */
  resolveYear(typed: number): number;
}

const DATE_FIELDS: readonly DateFieldName[] = ['year', 'month', 'day'];

const FIELD_WIDTH: Record<SegmentFieldName, number> = {
  year: 4,
  month: 2,
  day: 2,
  hour: 2,
  minute: 2,
  second: 2,
  dayPeriod: 1,
};

/** Which units each granularity draws in the time half. */
const UNITS: Record<TimeGranularity, readonly ('hour' | 'minute' | 'second')[]> = {
  hour: ['hour'],
  minute: ['hour', 'minute'],
  second: ['hour', 'minute', 'second'],
};

/** A date and a time whose every field is two digits and unambiguous. */
const REFERENCE = {
  date: { year: 2026, month: 9, day: 23 },
  time: { hour: 23, minute: 45, second: 55 },
};

function isDateField(field: SegmentFieldName): field is DateFieldName {
  return (DATE_FIELDS as readonly string[]).includes(field);
}

export function halfOfField(field: SegmentFieldName): DateTimeHalf {
  return isDateField(field) ? 'date' : 'time';
}

export function createDateTimeFormat(options: DateTimeFormatOptions = {}): DateTimeFormat {
  const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const granularity = options.granularity ?? 'minute';

  const dateFormat = createDateFormat({
    locale,
    ...(options.yearPivot === undefined ? {} : { yearPivot: options.yearPivot }),
    ...(options.firstDayOfWeek === undefined ? {} : { firstDayOfWeek: options.firstDayOfWeek }),
  });
  const timeFormat = createTimeFormat({
    locale,
    granularity,
    ...(options.hourCycle === undefined ? {} : { hourCycle: options.hourCycle }),
  });

  const units = UNITS[granularity];
  const shape: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: timeFormat.hourCycle,
    timeZone: 'UTC',
    ...(units.includes('minute') ? { minute: '2-digit' } : {}),
    ...(units.includes('second') ? { second: '2-digit' } : {}),
  };

  const at = (value: PlainDateTime) =>
    new Date(
      Date.UTC(
        value.date.year,
        value.date.month - 1,
        value.date.day,
        value.time.hour,
        value.time.minute,
        value.time.second,
      ),
    );

  const raw = new Intl.DateTimeFormat(locale, shape)
    .formatToParts(at(REFERENCE))
    .map((part) => (part.type === 'literal' ? { ...part, value: plainSpaces(part.value) } : part));

  /**
   * The placeholder of every field comes from the half that owns it, so
   * `dd/mm/aaaa` and `hh:mm` are the same words the two siblings already draw.
   */
  const placeholderOf = (field: SegmentFieldName): string => {
    const source = isDateField(field) ? dateFormat.pattern : timeFormat.pattern;
    const found = source.find((part) => part.type === field);
    return found?.value ?? field.charAt(0).repeat(FIELD_WIDTH[field]);
  };

  const kept = raw.filter(
    (part) => part.type === 'literal' || Object.hasOwn(FIELD_WIDTH, part.type),
  );

  /**
   * The boundary is wherever the two halves meet, and it is found rather than
   * assumed: a locale that writes the time first has its boundary between the
   * last time field and the first date field, and the same scan answers both.
   */
  const halves = kept.map((part) =>
    part.type === 'literal' ? null : halfOfField(part.type as SegmentFieldName),
  );
  const firstHalf = halves.find((half) => half !== null) ?? 'date';
  const lastOfFirst = halves.reduce((last, half, index) => (half === firstHalf ? index : last), -1);
  const firstOfSecond = halves.findIndex((half) => half !== null && half !== firstHalf);

  const pattern: DateTimePatternPart[] = kept.map((part, index) => {
    if (part.type !== 'literal') {
      const field = part.type as SegmentFieldName;
      return { type: field, value: placeholderOf(field), half: halfOfField(field) };
    }
    const between = firstOfSecond > lastOfFirst && index > lastOfFirst && index < firstOfSecond;
    if (!between) {
      /* A literal inside a half belongs to that half, which is what lets the
         row break between the two boxes and nowhere else. */
      const owner =
        index < firstOfSecond || firstOfSecond === -1
          ? firstHalf
          : (halves.slice(index).find((half) => half !== null) ?? firstHalf);
      return { type: 'literal' as const, value: part.value, half: owner };
    }
    return {
      type: 'literal' as const,
      value: part.value,
      half: firstHalf,
      boundary: true,
      /* Whitespace alone is not drawn: the row's own column gap is what
         separates the halves, and a rendered space beside that gap is twice
         the distance the locale asked for. */
      drawn: part.value.trim() !== '',
    };
  });

  const pad = (value: number, width: number) =>
    new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: width }).format(
      value,
    );

  const format: DateTimeFormat = {
    locale,
    hourCycle: timeFormat.hourCycle,
    granularity,
    pattern,
    digits: dateFormat.digits,
    usesDayPeriod: timeFormat.usesDayPeriod,
    firstDayOfWeek: dateFormat.firstDayOfWeek,
    date: dateFormat,
    time: timeFormat,

    halfOf: halfOfField,

    widthOf(field) {
      return FIELD_WIDTH[field];
    },

    formatValue(value, field) {
      if (isDateField(field)) return pad(value, FIELD_WIDTH[field]);
      return timeFormat.formatValue(value, field);
    },

    formatField(value, field) {
      if (isDateField(field)) return dateFormat.formatField(value.date, field);
      return timeFormat.formatField(value.time, field);
    },

    /**
     * Every literal is written here, the boundary included.
     *
     * `drawn` is about the *row of segments* and not about a string: there the
     * row's own column gap separates the halves, and a rendered space beside
     * that gap is twice the distance the locale asked for. A string has no
     * gap, so leaving the space out would run the two halves together.
     */
    format(value) {
      return pattern
        .map((part) =>
          part.type === 'literal' ? part.value : format.formatField(value, part.type),
        )
        .join('');
    },

    /**
     * ISO first, then the locale's own shape split at the boundary.
     *
     * Splitting is what makes the two halves' parsers reusable: each already
     * reads every shape its own locale writes, including the day period
     * anywhere in the text and the locale's own digits, and neither has to
     * learn the other's.
     */
    parse(text) {
      const trimmed = text.trim();
      if (trimmed === '') return null;

      const iso = /^(\d{4,6}-\d{2}-\d{2})[T ](.+)$/.exec(trimmed);
      if (iso !== null) {
        const date = dateFormat.parse(iso[1] as string);
        const time = timeFormat.parse(iso[2] as string);
        if (date !== null && time !== null) return { date, time };
      }

      /* The locale's own shape. The date half is a run of digits and
         separators; the time half is whatever follows the boundary. A boundary
         written as whitespace still splits, because one space is all `pt-BR`
         puts there. */
      const boundary = pattern.find((part) => part.boundary === true);
      const mark = boundary?.value.trim();
      const pieces =
        mark !== undefined && mark !== '' && trimmed.includes(mark)
          ? [
              trimmed.slice(0, trimmed.indexOf(mark)),
              trimmed.slice(trimmed.indexOf(mark) + mark.length),
            ]
          : splitOnWhitespace(trimmed);
      if (pieces === null) return null;

      const [first, second] = pieces;
      const dateText = firstHalf === 'date' ? first : second;
      const timeText = firstHalf === 'date' ? second : first;
      const date = dateFormat.parse((dateText ?? '').trim());
      const time = timeFormat.parse((timeText ?? '').trim());
      if (date === null || time === null) return null;
      try {
        return plainDateTime(date, time);
      } catch {
        return null;
      }
    },

    dayPeriodNames() {
      return timeFormat.dayPeriodNames();
    },

    describe(value) {
      return plainSpaces(
        new Intl.DateTimeFormat(locale, {
          dateStyle: 'long',
          timeStyle: granularity === 'second' ? 'medium' : 'short',
          timeZone: 'UTC',
        }).format(at(value)),
      );
    },

    describeDate(date, style = 'long') {
      if (style === 'long') return dateFormat.describe(date);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: style === 'narrow' ? 'short' : 'medium',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
    },

    toDisplay(hour) {
      return timeFormat.toDisplay(hour);
    },

    fromDisplay(hour, dayPeriod) {
      return timeFormat.fromDisplay(hour, dayPeriod);
    },

    resolveYear(typed) {
      return dateFormat.resolveYear(typed);
    },
  };

  return format;
}

/**
 * The last run of whitespace that has digits on both sides of it.
 *
 * A date and a time written with a space between them is the shape `pt-BR`,
 * `ja-JP` and a great many others use, and the space is the only thing marking
 * the join. Splitting on the *last* one is what keeps `10 de setembro de 2026
 * 15:20` whole: an early space is inside the date.
 */
function splitOnWhitespace(text: string): [string, string] | null {
  const matches = [...text.matchAll(/\s+/g)];
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index] as RegExpMatchArray;
    const at = match.index ?? 0;
    const head = text.slice(0, at);
    const tail = text.slice(at + match[0].length);
    if (/\d/.test(head) && /\d/.test(tail)) return [head, tail];
  }
  return null;
}

/**
 * One `SegmentState` holding both halves.
 *
 * `segmentsOf` and `segmentsOfTime` each return a whole state with the other
 * half's fields null, so neither can be spread over the other: the second
 * spread would write nulls over the first's work. They are merged field by
 * field instead, which is the one place that has to know both halves exist.
 */
export function segmentsOfDateTime(
  value: PlainDateTime | null,
  format: DateTimeFormat,
): SegmentState {
  const date = segmentsOf(value === null ? null : value.date);
  const time = segmentsOfTime(value === null ? null : value.time, format.time);
  return {
    ...EMPTY_SEGMENTS,
    year: date.year,
    month: date.month,
    day: date.day,
    hour: time.hour,
    minute: time.minute,
    second: time.second,
    dayPeriod: time.dayPeriod,
  };
}

/** The value the segments describe, or `null` while either half is unfinished. */
export function dateTimeOf(segments: SegmentState, format: DateTimeFormat): PlainDateTime | null {
  const date = dateOf(segments);
  const time = timeOf(segments, format.time);
  return date === null || time === null ? null : { date, time };
}

/**
 * Which half is still missing, and `null` when none is.
 *
 * An **empty** field is not an incomplete one: nothing has been written, so
 * there is nothing unfinished, and a form on first paint would otherwise mark
 * every control in it. A field with both halves half-written names the first
 * of the two in the locale's own writing order, because that is the one the
 * reader is on.
 */
export function incompleteHalf(
  segments: SegmentState,
  format: DateTimeFormat,
): DateTimeHalf | null {
  const written = FIELDS.some((field) => segments[field] !== null);
  if (!written) return null;

  const dateWhole = isComplete(segments);
  const timeWhole = isTimeComplete(segments, format.time);
  if (dateWhole && timeWhole) return null;
  if (dateWhole) return 'time';
  if (timeWhole) return 'date';

  /* Both unfinished: the half the reader is on is the one the locale writes
     first, which the pattern already knows. */
  const first = format.pattern.find((part) => part.type !== 'literal');
  return first?.half ?? 'date';
}

const FIELDS: readonly SegmentFieldName[] = [
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'dayPeriod',
];
