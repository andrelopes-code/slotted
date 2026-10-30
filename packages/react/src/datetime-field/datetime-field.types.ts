import type {
  DateTimeHalf,
  HourCycle,
  PlainDate,
  PlainDateTime,
  PlainTime,
  SegmentFieldName,
  SegmentState,
  TimeGranularity,
} from '@slotted/core/date';
import type { DatetimeFieldMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type DateTimeFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a datetime shows one frame twice rather than two frames.
 */
export type DateTimeFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The question a consumer asks about the clock. Which variant of each — `h11`
 * or `h12`, `h23` or `h24` — is the locale's own, and `Intl` answers it.
 */
export type DateTimeFieldHourCycle = 12 | 24;

/** Why the value moved. */
export type DateTimeFieldValueReason = Extract<
  ChangeRequest<PlainDateTime | null>['reason'],
  'keyboard' | 'clear' | 'blur' | 'programmatic'
>;

/**
 * What a request carries beyond the value.
 *
 * `segments` is the part no surveyed implementation has, and `incomplete` is
 * what it is for: a day with no hour is a state a whole-value model cannot
 * hold, and a consumer saving a draft saves both.
 *
 * There is no `crossesMidnight` here. `time-field` raises that flag because a
 * `PlainTime` has no day to put a crossing in, and names this family as the
 * consumer that would answer it — here the day exists, so the crossing is
 * already in the value.
 */
export interface DateTimeFieldChangeRequest extends ChangeRequest<PlainDateTime | null> {
  readonly segments: SegmentState;
  /** Which half is still missing, and `null` when none is. */
  readonly incomplete: DateTimeHalf | null;
}

/** What an application sets once for every datetime field under it. */
export interface DateTimeFieldDefaults {
  /** Only `gregory` today. The axis exists so a second calendar can arrive. */
  calendar: 'gregory';
  /** `0` is Sunday. Unset asks the locale. */
  firstDayOfWeek: number | undefined;
  granularity: TimeGranularity;
  /** Unset means the locale decides both the cycle and its variant. */
  hourCycle: DateTimeFieldHourCycle | undefined;
  /** Whether `+`, `-` and `=` open the duration expression. */
  relative: boolean;
  size: DateTimeFieldSize;
  /** Which zone answers "what is the time now". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: DateTimeFieldVariant;
  /** Two typed digits below this many years ahead are read as this century. */
  yearPivot: number | undefined;
}

export interface DateTimeFieldDefaultsProviderProps extends Partial<DateTimeFieldDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the frame. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface DateTimeFieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-cycle': `${DateTimeFieldHourCycle}`;
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-incomplete'?: DateTimeHalf | undefined;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-relative'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateTimeFieldSize;
  'data-ui': string;
  'data-variant': DateTimeFieldVariant;
  /**
   * The frame's own element. A substituted frame has to hand it back: the
   * family reaches the segments through it, and `focus()` is nothing without
   * one.
   */
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DateTimeFieldHandle {
  /** Puts focus on the first segment, which is where typing starts. */
  focus(): void;
  /** Empties both halves. Emits a request carrying the `clear` reason. */
  clear(): void;
  /** The segment currently holding focus, or `undefined`. */
  readonly activeField: SegmentFieldName | undefined;
}

export interface DateTimeFieldProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: PlainDateTime | null | undefined;
  /** The value the control starts from when nobody else writes one. */
  defaultValue?: PlainDateTime | null | undefined;
  /** Asked before the value moves, and able to cancel it. */
  onValueChange?:
    ((value: PlainDateTime | null, request: DateTimeFieldChangeRequest) => void) | undefined;

  /** The earliest whole value the control accepts: where the range starts. */
  min?: PlainDateTime | undefined;
  /** The latest whole value the control accepts: where the range ends. */
  max?: PlainDateTime | undefined;
  /**
   * The earliest time of **every** day inside the range.
   *
   * It applies beside `min` rather than instead of it, which MUI's own
   * validation page records that it cannot do. On `min`'s own day the window
   * starts at `min`'s time; on every other day it starts here.
   */
  minTime?: PlainTime | undefined;
  /** The latest time of every day inside the range, beside `max`. */
  maxTime?: PlainTime | undefined;
  /** Refuses particular days — a holiday, a closed shop, a booked room. */
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  /**
   * Refuses particular times on a particular day.
   *
   * Two predicates rather than one, because a day-level answer cannot be
   * derived from a datetime-level predicate without probing every step of that
   * day — and a calendar needs one answer per cell.
   */
  isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force decides.
   */
  locale?: string | undefined;
  /** Which zone answers "what is the time now", and nothing else. */
  timeZone?: string | undefined;
  hourCycle?: DateTimeFieldHourCycle | undefined;
  /** How much of the time half is written. The date half is always whole. */
  granularity?: TimeGranularity | undefined;
  calendar?: 'gregory' | undefined;
  firstDayOfWeek?: number | undefined;
  yearPivot?: number | undefined;
  /**
   * What an empty segment steps from, and what a duration resolves against.
   * Unset, both are the current datetime in `timeZone`. Stating it is what
   * makes a story and a test deterministic.
   */
  referenceDateTime?: PlainDateTime | undefined;

  size?: DateTimeFieldSize | undefined;
  variant?: DateTimeFieldVariant | undefined;

  /** Unstated rather than `false`, so the control defers to the field. */
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws a button that empties both halves and returns focus to the control. */
  clearable?: boolean | undefined;

  /** Whether `+`, `-` and `=` open the duration expression. */
  relative?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button's name and the duration expression's name.
   */
  messages?: PartialMessages<DatetimeFieldMessages> | undefined;

  /** The name a plain form post carries the `YYYY-MM-DDTHH:mm:ss` string under. */
  name?: string | undefined;
  /** The consumer's own slots, before and after the segments. */
  start?: ReactNode | undefined;
  end?: ReactNode | undefined;

  /** Substitutes the element the frame renders. */
  render?: ((props: DateTimeFieldRootProps) => ReactNode) | undefined;
  ref?: Ref<DateTimeFieldHandle> | undefined;
}

/** Re-exported for a consumer reading types rather than importing the core. */
export type { DateTimeHalf, HourCycle, SegmentFieldName, TimeGranularity };
