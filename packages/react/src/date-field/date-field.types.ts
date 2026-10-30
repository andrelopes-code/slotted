import type { DateFieldName, PlainDate, SegmentState } from '@slotted/core/date';
import type { DateFieldMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type DateFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a date shows one frame twice rather than two frames.
 */
export type DateFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The calendar system the value is written in.
 *
 * One value today, and it is an axis rather than a silence: a second calendar
 * system is a second arithmetic, and declaring the axis now is what keeps its
 * arrival from being a contract break. See
 * `docs/history/designs/2026-09-09-date-capability-inventory.md` §2.
 */
export type DateFieldCalendar = 'gregory';

/** Why the value moved. */
export type DateFieldValueReason = Extract<
  ChangeRequest<PlainDate | null>['reason'],
  'keyboard' | 'clear' | 'blur' | 'programmatic'
>;

/**
 * What a request carries beyond the value.
 *
 * `segments` is the part no surveyed implementation has. A date with a day and
 * a month and no year is not a date, so `value` is `null` — and it is not the
 * same as an empty field. A consumer saving a draft saves this.
 */
export interface DateFieldChangeRequest extends ChangeRequest<PlainDate | null> {
  readonly segments: SegmentState;
}

/** What an application sets once for every date field under it. */
export interface DateFieldDefaults {
  calendar: DateFieldCalendar;
  /** `0` is Sunday. Unset means the locale decides. */
  firstDayOfWeek: number | undefined;
  size: DateFieldSize;
  /** Which zone answers "what is today". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: DateFieldVariant;
  /** How far ahead a two-digit year may land before it is read as last century. */
  yearPivot: number;
}

export interface DateFieldDefaultsProviderProps extends Partial<DateFieldDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the frame. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface DateFieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-calendar': DateFieldCalendar;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateFieldSize;
  'data-ui': string;
  'data-variant': DateFieldVariant;
  /**
   * The frame's own element. A substituted frame has to hand it back: the
   * family reaches the segments through it, and `focus()` is nothing without
   * one.
   */
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DateFieldHandle {
  /** Puts focus on the first segment, which is where typing starts. */
  focus(): void;
  /** Empties every segment. Emits a request carrying the `clear` reason. */
  clear(): void;
  /** The segment currently holding focus, or `undefined`. */
  readonly activeField: DateFieldName | undefined;
}

export interface DateFieldProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: PlainDate | null | undefined;
  /** The value the control starts from when nobody else writes one. */
  defaultValue?: PlainDate | null | undefined;
  /** Asked before the value moves, and able to cancel it. */
  onValueChange?: ((value: PlainDate | null, request: DateFieldChangeRequest) => void) | undefined;

  /**
   * What the control holds: a day, or a month of a year. Under `month` the
   * field shows the month and the year segments in the locale's order, its
   * value is the first day of that month, and the hidden input submits
   * `YYYY-MM`. Defaults to `day`.
   */
  granularity?: 'day' | 'month' | undefined;

  /** The earliest date the control accepts. Reported through `aria-valuemin`. */
  min?: PlainDate | undefined;
  /** The latest date the control accepts. Reported through `aria-valuemax`. */
  max?: PlainDate | undefined;
  /** Refuses particular dates — a weekend, a holiday, a booked day. */
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force decides.
   */
  locale?: string | undefined;
  /** Which zone answers "what is today", and nothing else. */
  timeZone?: string | undefined;
  /** `0` is Sunday. Unset means the locale decides. */
  firstDayOfWeek?: number | undefined;
  /** How far ahead a two-digit year may land before it is read as last century. */
  yearPivot?: number | undefined;
  calendar?: DateFieldCalendar | undefined;

  size?: DateFieldSize | undefined;
  variant?: DateFieldVariant | undefined;

  /** Unstated rather than `false`, so the control defers to the field. */
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws a button that empties the value and returns focus to the control. */
  clearable?: boolean | undefined;
  /** Words laid over the catalog of the language in force, key by key: the clear button's name. */
  messages?: PartialMessages<DateFieldMessages> | undefined;

  /** The name a plain form post carries the ISO string under. */
  name?: string | undefined;
  /** The consumer's own slots, before and after the segments. */
  start?: ReactNode | undefined;
  end?: ReactNode | undefined;

  /** Substitutes the element the frame renders. */
  render?: ((props: DateFieldRootProps) => ReactNode) | undefined;
  ref?: React.Ref<DateFieldHandle> | undefined;
}
