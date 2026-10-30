/**
 * Reading and writing one date, in one locale.
 *
 * The shape of a date is not a table this library ships. `Intl.DateTimeFormat`
 * already knows that a Brazilian writes `09/09/2026`, an American writes
 * `09/09/2026` meaning a different day, a German writes `09.09.2026` and a
 * Japanese reader writes `2026/09/09`, and `formatToParts` names the order and
 * every separator between the fields. The parser is built from the formatter
 * for the reason `packages/core/src/number` builds one from `Intl.NumberFormat`:
 * everything the formatter can write is then read back, including the digits of
 * the locale's own numbering system.
 *
 * Nothing here touches the DOM or a framework.
 */

import { daysInMonth, parseISODate, plainDate } from './plain-date';
import type { PlainDate } from './plain-date';
import { hourCycleRange } from './time-format';
import type { HourCycle, TimeFieldName } from './time-format';

/** The three fields a date has. The four a time has are in `time-format.ts`. */
export type DateFieldName = 'year' | 'month' | 'day';

/**
 * Every field one segmented control can hold.
 *
 * The engine in `segments.ts` steps a number inside a range and knows nothing
 * about what a field means, so the union is wider than any one family draws:
 * `date-field` draws three of these, `time-field` four, and `datetime-field`
 * all seven.
 */
export type SegmentFieldName = DateFieldName | TimeFieldName;

export interface DatePatternPart {
  readonly type: DateFieldName | 'literal';
  /** The separator, for a literal; the placeholder text, for a field. */
  readonly value: string;
}

export type NameStyle = 'long' | 'short' | 'narrow';

export interface DateFormatOptions {
  /** BCP 47. Defaults to the runtime's own resolved locale. */
  locale?: string | undefined;
  /**
   * Which day a week starts on, `0` being Sunday. Defaults to what the locale
   * says, which is what `Intl.Locale.prototype.getWeekInfo` answers.
   */
  firstDayOfWeek?: number | undefined;
  /**
   * Two typed digits below this many years ahead of today are read as this
   * century. Defaults to 20: `30` is 2030 and `80` is 1980 in 2026.
   */
  yearPivot?: number | undefined;
}

export interface DateFormat {
  readonly locale: string;
  /** The fields in the order the locale writes them, with the literals between. */
  readonly pattern: readonly DatePatternPart[];
  readonly firstDayOfWeek: number;
  /** The ten digits this locale writes, in order. */
  readonly digits: readonly string[];
  /** How many digits each field is drawn with. The year is always four. */
  widthOf(field: DateFieldName): number;
  /** One field, padded and in the locale's digits. */
  formatField(date: PlainDate, field: DateFieldName): string;
  /** The whole date in the locale's shape. */
  format(date: PlainDate): string;
  /** The locale's shape first, then ISO 8601. `null` when it is neither. */
  parse(text: string): PlainDate | null;
  /** Twelve names, January first. */
  monthNames(style: NameStyle): string[];
  /** Seven names, starting on `firstDayOfWeek`. */
  weekdayNames(style: NameStyle): string[];
  /** The calendar heading. */
  monthYear(date: PlainDate, style?: 'long' | 'short'): string;
  /** The whole date in words, which is what a screen reader is given. */
  describe(date: PlainDate): string;
  /** Resolves two typed digits into a year, through the pivot. */
  resolveYear(typed: number): number;
}

const FIELD_WIDTH: Record<DateFieldName, number> = { year: 4, month: 2, day: 2 };
/** A day the calendar has in every month, so no field is padded to a shorter one. */
const REFERENCE = Date.UTC(2026, 8, 9);

/**
 * The ten digits this locale writes. A numbering system is part of the locale
 * rather than an option, so `ar-EG` writes `٢٠٢٦` and the parser reads it back;
 * Latin digits are accepted everywhere as well, because a keyboard that types
 * them exists in every locale. The same rule `number` states, for the same
 * reason.
 */
function digitsOf(locale: string): string[] {
  const format = new Intl.NumberFormat(locale, { useGrouping: false });
  return Array.from({ length: 10 }, (_, digit) => format.format(digit));
}

/**
 * The locale's own word for a field, reduced to a placeholder: `ano` becomes
 * `aaaa`, `year` becomes `yyyy`, `Tag` becomes `tt`. A name written as one
 * character — `年`, `月`, `日` — is used whole, because repeating an ideograph
 * four times is not a placeholder.
 */
function placeholderFor(locale: string, field: DateFieldName, width: number): string {
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

/**
 * The locale's pattern without its day, for a field that holds a month: the
 * day goes with the one separator that joined it to its neighbour — the one
 * after it when it leads or sits in the middle, the one before it when it
 * ends the pattern — so `MM/DD/YYYY` reads `MM/YYYY` and `YYYY/MM/DD` reads
 * `YYYY/MM`.
 */
export function yearMonthPattern(pattern: readonly DatePatternPart[]): DatePatternPart[] {
  const index = pattern.findIndex((part) => part.type === 'day');
  if (index === -1) return [...pattern];
  const after = pattern[index + 1]?.type === 'literal' && index + 2 < pattern.length;
  const drop = after ? index + 1 : index - 1;
  return pattern.filter(
    (_part, at) => at !== index && !(at === drop && pattern[at]?.type === 'literal'),
  );
}

/**
 * Which day the locale starts its week on, in the numbering `dayOfWeek` uses.
 * `getWeekInfo` answers 1 to 7 with Monday first and Sunday last, so `% 7`
 * turns Sunday's 7 into 0 and leaves every other day alone.
 */
function localeFirstDay(locale: string): number {
  try {
    const info = (
      new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }
    ).getWeekInfo?.();
    if (info !== undefined) return info.firstDay % 7;
  } catch {
    /* An engine without week info falls through to the common default. */
  }
  return 1;
}

export function createDateFormat(options: DateFormatOptions = {}): DateFormat {
  const locale = options.locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
  const yearPivot = options.yearPivot ?? 20;
  const firstDayOfWeek = options.firstDayOfWeek ?? localeFirstDay(locale);
  const digits = digitsOf(locale);

  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).formatToParts(new Date(REFERENCE));

  const pattern: DatePatternPart[] = parts
    .filter((part) => part.type === 'literal' || part.type in FIELD_WIDTH)
    .map((part) =>
      part.type === 'literal'
        ? { type: 'literal' as const, value: part.value }
        : {
            type: part.type as DateFieldName,
            value: placeholderFor(
              locale,
              part.type as DateFieldName,
              FIELD_WIDTH[part.type as DateFieldName],
            ),
          },
    );

  const fields = pattern.filter((part) => part.type !== 'literal').map((part) => part.type);

  const pad = (value: number, width: number) =>
    new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: width }).format(
      value,
    );

  /** Everything but the locale's own digits, so a pasted date is read whole. */
  const toLatin = (text: string) => {
    let latin = text;
    digits.forEach((digit, value) => {
      if (digit !== String(value)) latin = latin.split(digit).join(String(value));
    });
    return latin;
  };

  const names = (kind: 'month' | 'weekday', style: NameStyle, index: number) => {
    const formatter = new Intl.DateTimeFormat(locale, { [kind]: style, timeZone: 'UTC' });
    /* January 2023 opened on a Sunday, so the day of the month and the day of
       the week line up and one reference month serves both lists. */
    const at = kind === 'month' ? Date.UTC(2023, index, 15) : Date.UTC(2023, 0, 1 + index);
    return formatter.format(new Date(at));
  };

  const currentYear = new Date().getUTCFullYear();

  const format: DateFormat = {
    locale,
    pattern,
    firstDayOfWeek,
    digits,

    widthOf(field) {
      return FIELD_WIDTH[field];
    },

    formatField(date, field) {
      return pad(date[field], FIELD_WIDTH[field]);
    },

    format(date) {
      return pattern
        .map((part) => (part.type === 'literal' ? part.value : format.formatField(date, part.type)))
        .join('');
    },

    parse(text) {
      const trimmed = toLatin(text.trim());
      if (trimmed === '') return null;

      /* ISO 8601 is read first, and only when the text is exactly its shape:
         a four-digit leading run between hyphens is a year in every locale, so
         nothing ambiguous is taken here. `12/03/2026` is left to the locale
         below, where it is December to an American and March to a Brazilian. */
      if (/^\d{4,6}-\d{2}-\d{2}$/.test(trimmed)) return parseISODate(trimmed);

      const runs = trimmed.match(/\d+/g);
      if (runs !== null && runs.length === fields.length) {
        const read = { year: 0, month: 0, day: 0 };
        fields.forEach((field, index) => {
          read[field as DateFieldName] = Number(runs[index]);
        });
        if ((runs[fields.indexOf('year')] as string).length <= 2) {
          read.year = format.resolveYear(read.year);
        }
        try {
          return plainDate(read.year, read.month, read.day);
        } catch {
          return null;
        }
      }

      return parseISODate(trimmed);
    },

    monthNames(style) {
      return Array.from({ length: 12 }, (_, month) => names('month', style, month));
    },

    weekdayNames(style) {
      return Array.from({ length: 7 }, (_, index) =>
        names('weekday', style, (firstDayOfWeek + index) % 7),
      );
    },

    monthYear(date, style = 'long') {
      return new Intl.DateTimeFormat(locale, {
        month: style,
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(date.year, date.month - 1, 1)));
    },

    describe(date) {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(
        new Date(Date.UTC(date.year, date.month - 1, date.day)),
      );
    },

    /**
     * Two digits, resolved by a stated rule rather than by a guess. A value up
     * to `yearPivot` years ahead of this year is read as this century, and
     * anything above it as the last: in 2026 with the default pivot, `30` is
     * 2030 and `80` is 1980. A birth-date field sets the pivot to `0`, and
     * every two-digit year is then in the past.
     */
    resolveYear(typed) {
      if (typed >= 100) return typed;
      const century = Math.floor(currentYear / 100) * 100;
      const candidate = century + typed;
      return candidate <= currentYear + yearPivot ? candidate : candidate - 100;
    },
  };

  return format;
}

/**
 * What a field's range depends on. A day needs the month it is in, and an hour
 * needs the cycle it is drawn in; every other field's range is fixed.
 */
export interface FieldContext {
  readonly year?: number | undefined;
  readonly month?: number | undefined;
  readonly hourCycle?: HourCycle | undefined;
}

/**
 * The lowest and highest a field can hold, given what is known around it.
 *
 * This is the only place in the library where a segment field is named, which
 * is why adding a time to the chain is four rows here rather than a second
 * engine. A day asked for without a year and a month answers 31: the longest
 * month, stated rather than derived from a month that is not there.
 */
export function fieldRange(
  field: SegmentFieldName,
  context: FieldContext = {},
): { min: number; max: number } {
  switch (field) {
    case 'year':
      return { min: 1, max: 9999 };
    case 'month':
      return { min: 1, max: 12 };
    case 'day':
      return context.year === undefined || context.month === undefined
        ? { min: 1, max: 31 }
        : { min: 1, max: daysInMonth(context.year, context.month) };
    case 'hour':
      return hourCycleRange(context.hourCycle ?? 'h23');
    case 'minute':
    case 'second':
      return { min: 0, max: 59 };
    default:
      return { min: 0, max: 1 };
  }
}
