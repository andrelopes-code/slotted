/**
 * Reading and writing one time, in one locale.
 *
 * The shape of a time is not a table this library ships. `Intl.DateTimeFormat`
 * already knows that a Brazilian writes `21:05`, an American writes `9:05 PM`
 * and a Japanese reader writes `午後9:05`, and `formatToParts` names the order,
 * the separators and where the day period goes. The parser is built from the
 * formatter for the reason `format.ts` builds one from the date formatter:
 * everything the formatter can write is then read back, including the digits
 * of the locale's own numbering system.
 *
 * Nothing here touches the DOM or a framework.
 */

import { parseISOTime, plainTime } from './plain-time';
import type { PlainTime, TimeGranularity } from './plain-time';

/** The four fields a time has. The date fields belong to `format.ts`. */
export type TimeFieldName = 'hour' | 'minute' | 'second' | 'dayPeriod';

/**
 * The four cycles `Intl` resolves, which are four different ranges for one
 * segment. A boolean can say two of them, and a family that stores `12` where
 * `ja-JP` writes `0` is wrong in a way nobody notices until a Japanese reader
 * reports it.
 */
export type HourCycle = 'h11' | 'h12' | 'h23' | 'h24';

export interface TimePatternPart {
  readonly type: TimeFieldName | 'literal';
  /** The separator, for a literal; the placeholder text, for a field. */
  readonly value: string;
}

export interface TimeFormatOptions {
  /** BCP 47. Defaults to the runtime's own resolved locale. */
  locale?: string | undefined;
  /**
   * The question a consumer asks. Which variant of each — `h11` or `h12`,
   * `h23` or `h24` — is the locale's own. Unset means the locale decides both.
   */
  hourCycle?: 12 | 24 | undefined;
  granularity?: TimeGranularity | undefined;
}

/** The display hour a `PlainTime` hour is drawn as, and its day period. */
export interface DisplayHour {
  readonly hour: number;
  /** `0` for the first period, `1` for the second, `null` when there is none. */
  readonly dayPeriod: number | null;
}

export interface TimeFormat {
  readonly locale: string;
  readonly hourCycle: HourCycle;
  readonly granularity: TimeGranularity;
  /** The fields in the order the locale writes them, with the literals between. */
  readonly pattern: readonly TimePatternPart[];
  /** The ten digits this locale writes, in order. */
  readonly digits: readonly string[];
  /** Whether the resolved cycle draws a day period at all. */
  readonly usesDayPeriod: boolean;
  /** How many digits each field is drawn with. */
  widthOf(field: TimeFieldName): number;
  /** One field of a whole time, padded and in the locale's digits. */
  formatField(time: PlainTime, field: TimeFieldName): string;
  /** One display value, padded and in the locale's digits. */
  formatValue(value: number, field: TimeFieldName): string;
  /** The whole time in the locale's shape. */
  format(time: PlainTime): string;
  /** The locale's shape first, then ISO 8601. `null` when it is neither. */
  parse(text: string): PlainTime | null;
  /** The two names this locale writes, first period first. */
  dayPeriodNames(): readonly [string, string];
  /** The whole time in words, which is what a screen reader is given. */
  describe(time: PlainTime): string;
  toDisplay(hour: number): DisplayHour;
  fromDisplay(hour: number, dayPeriod: number | null): number;
}

const FIELD_WIDTH: Record<TimeFieldName, number> = {
  hour: 2,
  minute: 2,
  second: 2,
  dayPeriod: 1,
};

/** Which units each granularity draws. */
const UNITS: Record<TimeGranularity, readonly ('hour' | 'minute' | 'second')[]> = {
  hour: ['hour'],
  minute: ['hour', 'minute'],
  second: ['hour', 'minute', 'second'],
};

/** A day the calendar has everywhere, so no reference lands on a leap second. */
const REFERENCE_DAY = [2026, 8, 10] as const;

export function hourCycleRange(cycle: HourCycle): { min: number; max: number } {
  switch (cycle) {
    case 'h11':
      return { min: 0, max: 11 };
    case 'h12':
      return { min: 1, max: 12 };
    case 'h23':
      return { min: 0, max: 23 };
    default:
      return { min: 1, max: 24 };
  }
}

function digitsOf(locale: string): string[] {
  const format = new Intl.NumberFormat(locale, { useGrouping: false });
  return Array.from({ length: 10 }, (_, digit) => format.format(digit));
}

/** What the locale itself would use, asked of the engine rather than guessed. */
function localeHourCycle(locale: string): HourCycle {
  const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
  return (resolved.hourCycle as HourCycle | undefined) ?? 'h23';
}

/**
 * The cycle to resolve for a stated axis.
 *
 * The consumer states the family — twelve or twenty-four — and which variant of
 * it the locale writes is the engine's answer rather than a table kept here:
 * `hour12: true` resolves `h11` for `ja-JP` and `h12` for `en-US`, and
 * `hour12: false` resolves `h23` or `h24` the same way. A table would be a copy
 * of CLDR that goes stale, which is the reason `format.ts` asks the engine for
 * the first day of the week instead of listing it.
 */
function resolveHourCycle(locale: string, asked: 12 | 24 | undefined): HourCycle {
  if (asked === undefined) return localeHourCycle(locale);
  const resolved = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    hour12: asked === 12,
  }).resolvedOptions();
  return (resolved.hourCycle as HourCycle | undefined) ?? (asked === 12 ? 'h12' : 'h23');
}

/**
 * The locale's own word for a field, reduced to a placeholder: `hora` becomes
 * `hh`, `minute` becomes `mm`. The rule `format.ts` states for a date field,
 * for the same reason: `hh:mm` is English shown to everyone.
 */
function placeholderFor(locale: string, field: TimeFieldName, width: number): string {
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames(locale, { type: 'dateTimeField' }).of(field);
  } catch {
    name = undefined;
  }
  if (name === undefined || name === '') return field.charAt(0).repeat(width);
  const letters = [...name];
  if (letters.length <= 2) return name;
  return (letters[0] as string).toLowerCase().repeat(width);
}

export function createTimeFormat(options: TimeFormatOptions = {}): TimeFormat {
  const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const granularity = options.granularity ?? 'minute';
  const hourCycle = resolveHourCycle(locale, options.hourCycle);
  const usesDayPeriod = hourCycle === 'h11' || hourCycle === 'h12';
  const digits = digitsOf(locale);

  const units = UNITS[granularity];
  const shape: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    hourCycle,
    timeZone: 'UTC',
    ...(units.includes('minute') ? { minute: '2-digit' } : {}),
    ...(units.includes('second') ? { second: '2-digit' } : {}),
  };

  const at = (time: PlainTime) =>
    new Date(
      Date.UTC(
        REFERENCE_DAY[0],
        REFERENCE_DAY[1],
        REFERENCE_DAY[2],
        time.hour,
        time.minute,
        time.second,
      ),
    );

  const periods: [string, string] = [readDayPeriod(6), readDayPeriod(18)];

  function readDayPeriod(hour: number): string {
    const parts = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hourCycle: usesDayPeriod ? hourCycle : 'h12',
      timeZone: 'UTC',
    }).formatToParts(at({ hour, minute: 0, second: 0 }));
    return parts.find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
  }

  /* A reference time whose four fields are all two digits and unambiguous, so
     no part of the pattern is padded to a shorter one. */
  const parts = new Intl.DateTimeFormat(locale, shape).formatToParts(at(plainTime(23, 45, 55)));

  const pattern: TimePatternPart[] = parts
    .filter((part) => part.type === 'literal' || part.type in FIELD_WIDTH)
    .map((part) =>
      part.type === 'literal'
        ? { type: 'literal' as const, value: plainSpaces(part.value) }
        : {
            type: part.type as TimeFieldName,
            value:
              part.type === 'dayPeriod'
                ? periods[0]
                : placeholderFor(
                    locale,
                    part.type as TimeFieldName,
                    FIELD_WIDTH[part.type as TimeFieldName],
                  ),
          },
    );

  /** The fields a run of digits can land in, in the order the locale writes them. */
  const numericFields = pattern
    .map((part) => part.type)
    .filter(
      (type): type is 'hour' | 'minute' | 'second' =>
        type === 'hour' || type === 'minute' || type === 'second',
    );

  const pad = (value: number, width: number) =>
    new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: width }).format(
      value,
    );

  /** Everything but the locale's own digits, so a pasted time is read whole. */
  const toLatin = (text: string) => {
    let latin = text;
    digits.forEach((digit, value) => {
      if (digit !== String(value)) latin = latin.split(digit).join(String(value));
    });
    return latin;
  };

  const toDisplay = (hour: number): DisplayHour => {
    switch (hourCycle) {
      case 'h11':
        return { hour: hour % 12, dayPeriod: hour < 12 ? 0 : 1 };
      case 'h12':
        return { hour: hour % 12 === 0 ? 12 : hour % 12, dayPeriod: hour < 12 ? 0 : 1 };
      case 'h24':
        return { hour: hour === 0 ? 24 : hour, dayPeriod: null };
      default:
        return { hour, dayPeriod: null };
    }
  };

  const fromDisplay = (hour: number, dayPeriod: number | null): number => {
    switch (hourCycle) {
      case 'h11':
        return (hour % 12) + (dayPeriod === 1 ? 12 : 0);
      case 'h12':
        return (hour % 12) + (dayPeriod === 1 ? 12 : 0);
      case 'h24':
        return hour % 24;
      default:
        return hour % 24;
    }
  };

  const format: TimeFormat = {
    locale,
    hourCycle,
    granularity,
    pattern,
    digits,
    usesDayPeriod,

    widthOf(field) {
      return FIELD_WIDTH[field];
    },

    formatValue(value, field) {
      if (field === 'dayPeriod') return periods[value === 1 ? 1 : 0];
      return pad(value, FIELD_WIDTH[field]);
    },

    formatField(time, field) {
      if (field === 'hour') return pad(toDisplay(time.hour).hour, FIELD_WIDTH.hour);
      if (field === 'dayPeriod') return periods[toDisplay(time.hour).dayPeriod === 1 ? 1 : 0];
      return pad(time[field], FIELD_WIDTH[field]);
    },

    format(time) {
      return pattern
        .map((part) => (part.type === 'literal' ? part.value : format.formatField(time, part.type)))
        .join('');
    },

    parse(text) {
      const trimmed = toLatin(text.trim());
      if (trimmed === '') return null;

      /* ISO 8601 is read first, and only when the text is exactly its shape.
         Nothing ambiguous is taken here: `9:05 PM` is not that shape. */
      const iso = parseISOTime(trimmed);
      if (iso !== null) return iso;

      const runs = trimmed.match(/\d+/g);
      if (runs === null || runs.length === 0 || runs.length > numericFields.length) return null;

      const read = { hour: 0, minute: 0, second: 0 };
      runs.forEach((run, index) => {
        const field = numericFields[index];
        if (field !== undefined) read[field] = Number(run);
      });

      /* A day period written anywhere in the text, matched without its dots so
         `p.m.`, `PM` and `pm` are one answer. */
      const bare = (value: string) => value.toLocaleLowerCase(locale).replace(/[.\s]/g, '');
      const written = bare(trimmed);
      const period = periods.findIndex((name) => name !== '' && written.includes(bare(name)));

      /* An hour outside the cycle's own range is a typo, not a time to wrap:
         `25:00` is refused rather than read as one in the morning. */
      const { min, max } = hourCycleRange(hourCycle);
      if (read.hour < min || read.hour > max) return null;

      const hour = usesDayPeriod && period >= 0 ? fromDisplay(read.hour, period) : read.hour % 24;
      try {
        return plainTime(hour, read.minute, read.second);
      } catch {
        return null;
      }
    },

    dayPeriodNames() {
      return periods;
    },

    describe(time) {
      return plainSpaces(
        new Intl.DateTimeFormat(locale, {
          ...shape,
          hour: 'numeric',
          ...(units.includes('minute') ? { minute: '2-digit' } : {}),
        }).format(at(time)),
      );
    },

    toDisplay,
    fromDisplay,
  };

  return format;
}

/**
 * The text with every no-break space written as a plain one.
 *
 * ICU writes U+202F before the day period in Node and in some browsers, and
 * U+0020 in others. A time rendered on a server and again in a browser then
 * differed by one character, and React discarded the server's tree. One space
 * in every engine is the same text everywhere.
 */
export function plainSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, ' ');
}
