import type {
  HourCycle,
  PlainTime,
  SegmentState,
  TimeFieldName,
  TimeGranularity,
} from '@slotted/core/date';
import type { PartialMessages, TimeFieldMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type TimeFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a time shows one frame twice rather than two frames.
 */
export type TimeFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The question a consumer asks about the clock. Which variant of each — `h11`
 * or `h12`, `h23` or `h24` — is the locale's own, and `Intl` answers it.
 */
export type TimeFieldHourCycle = 12 | 24;

/** Why the value moved. */
export type TimeFieldValueReason = Extract<
  ChangeRequest<PlainTime | null>['reason'],
  'keyboard' | 'clear' | 'blur' | 'programmatic'
>;

/**
 * What a request carries beyond the value.
 *
 * `segments` is the part no surveyed implementation has: an hour with no minute
 * is a state a whole-value model cannot hold, and a consumer saving a draft
 * saves this. `crossesMidnight` is the other: a duration resolved past midnight
 * lands on a different day, and this library holds no day beside a time.
 */
export interface TimeFieldChangeRequest extends ChangeRequest<PlainTime | null> {
  readonly segments: SegmentState;
  readonly crossesMidnight: boolean;
}

/** What an application sets once for every time field under it. */
export interface TimeFieldDefaults {
  granularity: TimeGranularity;
  /** Unset means the locale decides both the cycle and its variant. */
  hourCycle: TimeFieldHourCycle | undefined;
  /** Whether `+`, `-` and `=` open the duration expression. */
  relative: boolean;
  size: TimeFieldSize;
  /** Which zone answers "what time is it now". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: TimeFieldVariant;
}

export interface TimeFieldDefaultsProviderProps extends Partial<TimeFieldDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the frame. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface TimeFieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-cycle': `${TimeFieldHourCycle}`;
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-relative'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': TimeFieldSize;
  'data-ui': string;
  'data-variant': TimeFieldVariant;
  /**
   * The frame's own element. A substituted frame has to hand it back: the
   * family reaches the segments through it, and `focus()` is nothing without
   * one.
   */
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface TimeFieldHandle {
  /** Puts focus on the first segment, which is where typing starts. */
  focus(): void;
  /** Empties every segment. Emits a request carrying the `clear` reason. */
  clear(): void;
  /** The segment currently holding focus, or `undefined`. */
  readonly activeField: TimeFieldName | undefined;
}

export interface TimeFieldProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: PlainTime | null | undefined;
  /** The value the control starts from when nobody else writes one. */
  defaultValue?: PlainTime | null | undefined;
  /** Asked before the value moves, and able to cancel it. */
  onValueChange?: ((value: PlainTime | null, request: TimeFieldChangeRequest) => void) | undefined;

  /** The earliest time the control accepts. Reported through `aria-valuemin`. */
  min?: PlainTime | undefined;
  /** The latest time the control accepts. Reported through `aria-valuemax`. */
  max?: PlainTime | undefined;
  /** Refuses particular times — a lunch break, a booked slot, a closed shop. */
  isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;

  /**
   * BCP 47. Decides the field order, the separators and the placeholder.
   * Unset, the language in force (`SlottedProvider`) decides.
   */
  locale?: string | undefined;
  /** Which zone answers "what time is it now", and nothing else. */
  timeZone?: string | undefined;
  hourCycle?: TimeFieldHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  /**
   * What an empty segment steps from, and what a duration resolves against.
   * Unset, both are the current time in `timeZone`. Stating it is what makes a
   * story and a test deterministic.
   */
  referenceTime?: PlainTime | undefined;

  size?: TimeFieldSize | undefined;
  variant?: TimeFieldVariant | undefined;

  /** Unstated rather than `false`, so the control defers to the field. */
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws a button that empties the value and returns focus to the control. */
  clearable?: boolean | undefined;

  /** Whether `+`, `-` and `=` open the duration expression. */
  relative?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button, the duration region's name and the next-day preview.
   */
  messages?: PartialMessages<TimeFieldMessages> | undefined;

  /** The name a plain form post carries the `HH:mm:ss` string under. */
  name?: string | undefined;
  /** The consumer's own slots, before and after the segments. */
  start?: ReactNode | undefined;
  end?: ReactNode | undefined;

  /** Substitutes the element the frame renders. */
  render?: ((props: TimeFieldRootProps) => ReactNode) | undefined;
  ref?: Ref<TimeFieldHandle> | undefined;
}

/** The two names a hour cycle is resolved from, for a consumer reading types. */
export type { HourCycle, TimeFieldName, TimeGranularity };
