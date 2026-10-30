/**
 * Reading and writing one number, in one locale.
 *
 * `number-field` cannot use `input[type=number]`: the HTML value sanitization
 * algorithm sets the value to the empty string whenever the text is not a
 * valid floating-point number, so no grouping separator, no decimal comma and
 * no currency affix survives it. A text input has to be told what a number
 * looks like instead, and both bindings have to be told the same thing —
 * otherwise React and Angular disagree about what `1.234` means.
 *
 * The parser is built from the formatter rather than from configured
 * separators. `Intl.NumberFormat.formatToParts` names the locale's group
 * separator, its decimal separator, its minus sign and its affixes, and the
 * locale's own numbering system supplies the ten digits, so everything the
 * formatter can write is read back. Ant Design, Mantine and PrimeNG each
 * configure the separators by hand, in one framework each.
 *
 * Nothing here touches the DOM or a framework.
 */

import { clamp, roundTo } from '../measure';

export interface NumberFormatRequest {
  /** BCP 47. Defaults to the runtime's own locale. */
  locale?: string | undefined;
  options?: Intl.NumberFormatOptions | undefined;
}

/** A string and where the caret sits in it. What an edit reads and what it returns. */
export interface TypedText {
  readonly text: string;
  readonly caret: number;
}

export interface NumberFormat {
  readonly locale: string;
  /** What `Intl` settled on, which is what the software keyboard is derived from. */
  readonly maximumFractionDigits: number;
  /** The empty value is the empty string: nothing typed is not nought. */
  format(value: number | null): string;
  /** The number the text means, or `null` when it means nothing yet. */
  parse(text: string): number | null;
  /** Whether the text is on its way to a number, which is what a keystroke filter asks. */
  isPartial(text: string): boolean;
  /**
   * The reader's own text, given the locale's shape, without taking away
   * anything still being typed — and the caret put back on the character it
   * was on rather than at the index it was at.
   *
   * The integer side is regrouped and given the format's affixes; the fraction
   * side is left exactly as typed, so `1,50` keeps its nought and `1,` keeps
   * its separator. Rounding is a commit's job, not a keystroke's.
   *
   * Returns the input untouched when the text is not on its way to a number,
   * which is what leaves a half-typed value alone.
   */
  formatWhileTyping(typed: TypedText): TypedText;
  /**
   * Whether the character is one the reader typed rather than one the family
   * inserted: a digit in either the locale's numbering system or in Latin, the
   * decimal separator, or a minus sign. A grouping separator is not one.
   *
   * The caret is measured in these, and a deletion that removes none of them
   * removed only punctuation.
   */
  isTyped(character: string): boolean;
  /**
   * Backspace pressed against a grouping separator, taking the digit the
   * reader meant instead of the punctuation the family inserted.
   *
   * A deletion that removed a separator and nothing else is a keystroke that
   * did nothing: the separator is put straight back by the next regrouping, so
   * the reader presses the key twice to lose one digit. `previous` is the text
   * before the browser applied the edit; `typed` is what it left behind.
   *
   * Returns `typed` untouched when the reader deleted something of their own,
   * or deleted a selection rather than a single character.
   */
  deleteAcrossSeparator(previous: string, typed: TypedText, direction: -1 | 1): TypedText;
}

/** `Intl.NumberFormat`'s own maximum for fraction digits, which the spec fixes at 100. */
const SIGNIFICANT_DIGIT_CEILING = 100;

/**
 * How long a held stepper waits before it starts repeating, and how fast it
 * repeats after that.
 *
 * The numbers are React Aria's, which are the only ones in the surveyed field
 * arrived at by testing rather than by taste: a coarse pointer waits longer,
 * because a finger that is starting to scroll rests on the button first.
 *
 * They live here rather than in either binding for the reason everything else
 * in this module does — two bindings must not disagree about how fast a value
 * moves — and they are not motion-scale tokens: nothing animates, and a theme
 * that could retune this could make a stepper unusable.
 */
export const STEP_REPEAT_DELAY = 400;
export const STEP_REPEAT_DELAY_COARSE = 600;
export const STEP_REPEAT_INTERVAL = 60;

/**
 * Pixels of horizontal travel per step while a `scrub` part is dragged.
 * Base UI's `pixelSensitivity` default, the one figure in the surveyed field.
 */
export const SCRUB_SENSITIVITY = 2;

export interface Scrub {
  /**
   * Whole steps travelled since the last call, signed: positive towards the
   * inline end. The remainder under one step is kept, so slow travel still
   * adds up instead of being rounded away on every event.
   */
  steps(clientX: number): number;
}

/**
 * The arithmetic of a horizontal drag that moves a number. Both bindings feed
 * it pointer coordinates and turn its answer into steps; the direction is the
 * reading direction's, so in a right-to-left document a drag towards the left
 * edge — the inline end — is a step up.
 */
export function createScrub({
  clientX,
  sensitivity = SCRUB_SENSITIVITY,
  rtl = false,
}: {
  clientX: number;
  sensitivity?: number;
  rtl?: boolean;
}): Scrub {
  const per = sensitivity > 0 ? sensitivity : SCRUB_SENSITIVITY;
  let origin = clientX;
  return {
    steps(next) {
      const travelled = (rtl ? origin - next : next - origin) / per;
      const whole = Math.trunc(travelled);
      if (whole !== 0) origin += (rtl ? -whole : whole) * per;
      return whole;
    },
  };
}

/**
 * The ten digits this locale writes, in order. A numbering system is part of
 * the locale rather than an option, so `ar-EG` writes `١٤٨٠` and the parser has
 * to read it back; Latin digits are accepted everywhere as well, because a
 * keyboard that types them is available in every locale.
 */
export function digitsOf(locale: string) {
  const digits = new Intl.NumberFormat(locale, { useGrouping: false });
  return Array.from({ length: 10 }, (_, index) => digits.format(index));
}

/**
 * Every literal `Intl` writes around the digits: a currency symbol, a percent
 * sign, a unit, and the spaces they come with. They are removed before the
 * number is read, so a value pasted whole from a bank statement parses.
 */
function affixesOf(formatter: Intl.NumberFormat) {
  const affixes = new Set<string>();
  for (const sample of [-1234.5, 1234.5]) {
    for (const part of formatter.formatToParts(sample)) {
      if (part.type === 'literal' || part.type === 'currency' || part.type === 'unit') {
        affixes.add(part.value);
      }
      if (part.type === 'percentSign' || part.type === 'compact') affixes.add(part.value);
    }
  }
  /* Longest first, so a two-character affix is not half-removed by a shorter one. */
  return [...affixes].filter((affix) => affix.length > 0).sort((a, b) => b.length - a.length);
}

function partValue(formatter: Intl.NumberFormat, sample: number, type: string) {
  return formatter.formatToParts(sample).find((part) => part.type === type)?.value;
}

export function createNumberFormat({ locale, options }: NumberFormatRequest = {}): NumberFormat {
  const formatter = new Intl.NumberFormat(locale, options);
  const resolved = formatter.resolvedOptions();
  const digits = digitsOf(resolved.locale);
  const group = partValue(formatter, 1234.5, 'group') ?? '';
  /**
   * A format that writes no fraction writes no decimal separator either, so
   * there is no part to read one from: a percent format rounds to whole
   * percents by default, and its `formatToParts(1234.5)` is all digits and
   * groups. The literal `.` that stood in for the missing part is the grouping
   * separator in every locale that groups with a full stop, which made the two
   * indistinguishable. A second formatter, asked for a fraction it cannot
   * refuse, names the separator the locale would use if it had one.
   */
  const decimal =
    partValue(formatter, 1234.5, 'decimal') ??
    partValue(
      new Intl.NumberFormat(locale, {
        ...options,
        /* Both, and in this order: a minimum above the format's own maximum is
           a `RangeError`, and the maximum a currency carries is its own. */
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
      1234.5,
      'decimal',
    ) ??
    '.';
  const minus = partValue(formatter, -1234.5, 'minusSign') ?? '-';
  const affixes = affixesOf(formatter);
  /* A percentage is a fraction the formatter multiplies, so the parser divides. */
  const scale = resolved.style === 'percent' ? 100 : 1;

  /**
   * Everything but the sign, the digits and one decimal separator, taken out.
   * The order matters: affixes first, because a currency symbol may itself
   * contain a character the digit map would otherwise touch.
   */
  const normalise = (text: string) => {
    let normalised = text.trim();
    for (const affix of affixes) normalised = normalised.split(affix).join('');
    digits.forEach((digit, index) => {
      if (digit !== String(index)) normalised = normalised.split(digit).join(String(index));
    });
    if (group !== '') normalised = normalised.split(group).join('');
    normalised = normalised.split(decimal).join('.');
    /* U+2212 as well as the locale's own sign: a reader may paste either. */
    normalised = normalised.split(minus).join('-').split('−').join('-');
    /* Every remaining space, including the narrow ones French grouping uses. */
    return normalised.replace(/\s+/gu, '');
  };

  /**
   * `Intl` leaves this unresolved when the format rounds by significant digits
   * instead of by fraction digits. Fractions are allowed in that case, so the
   * absence resolves to the platform's own ceiling rather than to nought — a
   * nought here would refuse the decimal separator on a format that writes one.
   */
  const maximumFractionDigits = resolved.maximumFractionDigits ?? SIGNIFICANT_DIGIT_CEILING;
  const partial = maximumFractionDigits > 0 ? /^[+-]?\d*(?:\.\d*)?$/ : /^[+-]?\d*$/;

  /**
   * The characters the reader put there. The caret is measured in these rather
   * than in string indices, because the family inserts and removes grouping
   * separators between two keystrokes and an index counted across them lands
   * on a different character than the one it left.
   *
   * A grouping separator is deliberately absent: it is the family's, not the
   * reader's, which is also what tells a deletion that removed only one of
   * them apart from a deletion that removed something.
   */
  const typedCharacters = new Set([
    ...digits,
    ...'0123456789',
    /* Only when the format admits a fraction at all: on one that does not, the
       separator is refused at the keystroke and counting it would count the
       grouping separator wherever the two are the same character. */
    ...(maximumFractionDigits > 0 && decimal !== group ? [decimal] : []),
    minus,
    '-',
    '−',
    '+',
  ]);
  const isTyped = (character: string) => typedCharacters.has(character);

  /** How many of the reader's own characters stand before `caret`. */
  const typedBefore = (text: string, caret: number) => {
    let seen = 0;
    for (let index = 0; index < Math.min(caret, text.length); index += 1) {
      if (isTyped(text[index] as string)) seen += 1;
    }
    return seen;
  };

  /** Where the caret goes to stand after `count` of the reader's own characters. */
  const caretAfter = (text: string, count: number) => {
    if (count === 0) {
      /* Before the first character the reader owns, which is past a prefix like
         `R$ ` rather than at index nought inside it. */
      const first = [...text].findIndex((character) => isTyped(character));
      return first === -1 ? text.length : first;
    }
    let seen = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (isTyped(text[index] as string)) {
        seen += 1;
        if (seen === count) return index + 1;
      }
    }
    return text.length;
  };

  /**
   * The whole number, grouped and given the format's affixes, with no fraction
   * at all. The fraction the reader typed is spliced into it afterwards rather
   * than handed to `Intl`, which would round it, pad it, or drop a trailing
   * nought the reader is still typing past.
   */
  const wholeFormatter = new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  /**
   * Beyond fifteen digits a double no longer holds the integer exactly, so the
   * text the reader is looking at would stop being the text they typed. The
   * same ceiling `currency-field` puts on its digit run.
   */
  const EXACT_INTEGER_DIGITS = 15;

  /**
   * A format that rounds by significant digits rewrites the integer itself —
   * `maximumSignificantDigits: 3` turns 1234 into 1230 — so there is no shape
   * to regroup a half-typed number into. Such a format is left to the commit.
   */
  const roundsBySignificantDigits = resolved.minimumSignificantDigits !== undefined;

  /**
   * Under the accounting sign a negative is written as parentheses rather than
   * as a minus, so the character the reader typed to make the amount negative
   * is not in the text that comes back. Reshaping it mid-keystroke turns `-12`
   * into `(R$ 12)`, and the next keystroke lands outside the bracket the
   * parser strips — the amount silently loses its sign. It is left to the
   * commit, which writes the whole string at once and has nothing to preserve.
   */
  const writesAccountingSign =
    (resolved as Intl.ResolvedNumberFormatOptions & { currencySign?: string }).currencySign ===
    'accounting';

  const formatWhileTyping = (typed: TypedText): TypedText => {
    if (roundsBySignificantDigits || writesAccountingSign) return typed;

    /**
     * The reader's own characters, and nothing else. `normalise` is the
     * parser's route and it removes an affix only whole: a caret that landed
     * between the `R` and the `$` of a prefix and pressed Backspace left
     * `R 12.345`, which no affix matched, so the text stayed broken and the
     * value went null. Every character this function does not keep is one it
     * regenerates, so filtering is both simpler and the repair.
     */
    const skeleton = [...typed.text]
      .filter(isTyped)
      .map((character) => {
        const digit = digits.indexOf(character);
        if (digit !== -1) return String(digit);
        if (character === decimal) return '.';
        if (character === minus || character === '−') return '-';
        return character;
      })
      .join('');
    if (!partial.test(skeleton)) return typed;

    const negative = skeleton.startsWith('-');
    const body = skeleton.replace(/^[+-]/, '');
    const point = body.indexOf('.');
    const whole = point === -1 ? body : body.slice(0, point);
    const fraction = point === -1 ? '' : body.slice(point + 1);

    /* Nothing but a sign, or nothing at all: there is no number to shape yet. */
    if (whole === '' && point === -1) return typed;
    if (whole.length > EXACT_INTEGER_DIGITS) return typed;

    /* `scale` is 100 for a percent format, whose formatter multiplies back. */
    const magnitude = (whole === '' ? 0 : Number(whole)) / scale;
    const parts = wholeFormatter.formatToParts(negative ? -magnitude : magnitude);

    /**
     * The fraction goes where the last digit of the whole is, which is the end
     * of the number and not the end of the string: a locale that writes its
     * currency or its percent sign after the digits has parts still to come.
     */
    const lastWhole = parts.map((part) => part.type).lastIndexOf('integer');
    const text = parts.reduce((built, part, index) => {
      /* A reader who has typed only `-,` or `,` owns no integer digit yet, so
         the nought `Intl` had to be given to produce the shape is not shown as
         a digit nobody typed. */
      const dropped = whole === '' && (part.type === 'integer' || part.type === 'group');
      const written = built + (dropped ? '' : part.value);
      return index === lastWhole && point !== -1 ? written + decimal + fraction : written;
    }, '');

    return { text, caret: caretAfter(text, typedBefore(typed.text, typed.caret)) };
  };

  const deleteAcrossSeparator = (
    previous: string,
    typed: TypedText,
    direction: -1 | 1,
  ): TypedText => {
    if (previous.length - typed.text.length !== 1) return typed;
    /* Backward or forward, the character the browser took stood where the
       caret stands now: a backspace moved the caret onto it, and a delete
       never moved the caret at all. */
    const removed = previous[typed.caret];
    if (removed === undefined || isTyped(removed)) return typed;

    const { text, caret } = typed;
    if (direction === -1) {
      for (let index = caret - 1; index >= 0; index -= 1) {
        if (isTyped(text[index] as string)) {
          return { text: text.slice(0, index) + text.slice(index + 1), caret: index };
        }
      }
      return typed;
    }
    for (let index = caret; index < text.length; index += 1) {
      if (isTyped(text[index] as string)) {
        return { text: text.slice(0, index) + text.slice(index + 1), caret };
      }
    }
    return typed;
  };

  return {
    deleteAcrossSeparator,
    formatWhileTyping,
    isTyped,

    locale: resolved.locale,
    maximumFractionDigits,

    format(value) {
      if (value === null || Number.isNaN(value)) return '';
      return formatter.format(value);
    },

    parse(text) {
      const normalised = normalise(text);
      if (normalised === '' || !partial.test(normalised)) return null;
      const parsed = Number(normalised);
      if (Number.isNaN(parsed)) return null;
      return scale === 1
        ? parsed
        : roundTo(parsed / scale, Math.min(maximumFractionDigits + 2, 15));
    },

    isPartial(text) {
      return partial.test(normalise(text));
    },
  };
}

/**
 * How many fraction digits a value is written with. Exponent notation is
 * counted rather than trusted to `String`: `1e-7` has seven, and reading its
 * text form would report none.
 */
export function decimalsOf(value: number) {
  if (!Number.isFinite(value)) return 0;
  const text = String(Math.abs(value));
  const exponent = text.indexOf('e');
  if (exponent === -1) {
    const point = text.indexOf('.');
    return point === -1 ? 0 : text.length - point - 1;
  }
  const mantissa = text.slice(0, exponent);
  const power = Number(text.slice(exponent + 1));
  const point = mantissa.indexOf('.');
  const written = point === -1 ? 0 : mantissa.length - point - 1;
  return Math.max(0, written - power);
}

/**
 * The nearest multiple of `step`, measured from `origin` rather than from
 * nought. React Aria states the rule: with a minimum of 2 and a step of 3 the
 * valid values are 2, 5, 8, 11 — the minimum is where the scale starts, and a
 * scale that started at nought would make the minimum itself invalid.
 */
export function snapToStep(value: number, step: number, origin: number) {
  if (step <= 0) return value;
  const snapped = origin + Math.round((value - origin) / step) * step;
  return roundTo(snapped, Math.max(decimalsOf(step), decimalsOf(origin)));
}

export interface StepRequest {
  value: number | null;
  direction: 1 | -1;
  step: number;
  min?: number | undefined;
  max?: number | undefined;
  /** Where an empty field starts. Defaults to `min`, and to nought without one. */
  stepFrom?: number | undefined;
  snapToStep?: boolean | undefined;
}

/**
 * One step, in one direction, held inside the range.
 *
 * An empty field steps to `stepFrom` itself rather than to `stepFrom` plus a
 * step: pressing increment on a blank amount has to produce a number, and the
 * number it produces is the one the consumer named.
 */
export function stepNumber({
  value,
  direction,
  step,
  min,
  max,
  stepFrom,
  snapToStep: snap = false,
}: StepRequest): number {
  const low = min ?? Number.NEGATIVE_INFINITY;
  const high = max ?? Number.POSITIVE_INFINITY;

  if (value === null || Number.isNaN(value)) {
    const start = stepFrom ?? min ?? 0;
    return clamp(start, low, high);
  }

  const decimals = Math.max(decimalsOf(step), decimalsOf(value));

  if (!snap) return clamp(roundTo(value + direction * step, decimals), low, high);

  /**
   * Snapping steps to the next value *on the grid*, which is not the same as
   * stepping and then snapping: from 4, with a minimum of 2 and a step of 3,
   * the grid is 2, 5, 8 and the next value up is 5. Stepping first would reach
   * 7 and snap to 8, skipping the value the reader was one keystroke away from.
   */
  const origin = min ?? 0;
  const nearest = snapToStep(value, step, origin);
  const next =
    direction === 1
      ? nearest > value
        ? nearest
        : nearest + step
      : nearest < value
        ? nearest
        : nearest - step;
  return clamp(roundTo(next, decimals), low, high);
}

/** A stretch of a formatted figure, and whether it is drawn as the secondary part. */
export interface FigureRun {
  readonly text: string;
  readonly secondary: boolean;
}

/** The parts that qualify the whole units a reader compares: symbol, decimals, suffix. */
const SECONDARY_PARTS: ReadonlySet<string> = new Set([
  'compact',
  'currency',
  'decimal',
  'fraction',
  'percentSign',
  'unit',
]);

/**
 * A formatted figure in runs, adjacent secondary parts merged, in the locale's
 * own order and with its literals, so the runs join back to `format()`.
 */
export function figureRuns(parts: readonly Intl.NumberFormatPart[]): FigureRun[] {
  const runs: { text: string; secondary: boolean }[] = [];
  for (const part of parts) {
    const secondary = SECONDARY_PARTS.has(part.type);
    const last = runs.at(-1);
    if (last && last.secondary === secondary) last.text += part.value;
    else runs.push({ text: part.value, secondary });
  }
  return runs;
}
