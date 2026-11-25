import type { PickerPreset, PlainTime, TimeGranularity, TimeRangeValue } from '@slotted/core/date';
import type { PartialMessages, TimeRangePickerMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { ClockSlotState } from '../clock';
import type { TimeFieldHourCycle } from '../time-field';

/** A run of times, either end of which may be open. */
export type TimeRange = TimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type TimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type TimeRangePickerSize = 'sm' | 'md' | 'lg';
export type TimeRangePickerVariant = 'outline' | 'subtle' | 'plain';

/** The end being edited: the half and the clock carrying `data-current`. */
export type TimeRangePickerPosition = 'start' | 'end';

export type TimeRangePickerValueReason = Extract<
  ChangeRequest<TimeRange | null>['reason'],
  'pointer' | 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic'
>;

/** What an application sets once for every time range picker under it. */
export interface TimeRangePickerDefaults {
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: TimeFieldHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  placement: TimeRangePickerPlacement;
  size: TimeRangePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  variant: TimeRangePickerVariant;
}

export interface TimeRangePickerDefaultsProviderProps extends Partial<TimeRangePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface TimeRangePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': TimeRangePickerSize;
  'data-ui': string;
  'data-variant': TimeRangePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface TimeRangePickerHandle {
  /** Puts focus on the trigger, which is the frame. */
  focus(): void;
  open(): void;
  close(): void;
}

export interface TimeRangePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: TimeRange | null | undefined;
  defaultValue?: TimeRange | null | undefined;
  onValueChange?:
    ((value: TimeRange | null, request: ChangeRequest<TimeRange | null>) => void) | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** Present means the consumer owns which end is being edited. */
  position?: TimeRangePickerPosition | undefined;
  defaultPosition?: TimeRangePickerPosition | undefined;
  onPositionChange?:
    | ((position: TimeRangePickerPosition, request: ChangeRequest<TimeRangePickerPosition>) => void)
    | undefined;

  min?: PlainTime | undefined;
  max?: PlainTime | undefined;
  isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;
  /**
   * Whether a run may cross an unavailable time. On, and with a start chosen,
   * the times beyond the first unavailable one are refused in the clock of the
   * end; off, the run may jump over it. A typed run whose end is unavailable is
   * invalid either way.
   */
  contiguous?: boolean | undefined;
  /** The shortest and longest run allowed, in seconds. */
  minLength?: number | undefined;
  maxLength?: number | undefined;
  lengthLabel?: TimeRangePickerDefaults['lengthLabel'] | undefined;

  /** Seconds between two offered times. Ignored when `options` states the list. */
  step?: number | undefined;
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  options?: readonly PlainTime[] | undefined;

  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  hourCycle?: TimeFieldHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  /** What "now" is, for a story or a test; the clock otherwise. */
  referenceTime?: PlainTime | undefined;

  size?: TimeRangePickerSize | undefined;
  variant?: TimeRangePickerVariant | undefined;
  placement?: TimeRangePickerPlacement | undefined;
  /**
   * Whether the panel keeps a draft until Apply. `false` writes a whole run on
   * every press, and closes on the one that completes it. Defaults to `true`.
   */
  confirm?: boolean | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws one clear on the frame, which empties both ends. */
  clearable?: boolean | undefined;
  /** Whether the fields of the two ends take the relative expression. */
  relative?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the limits, and what is said of a refused run.
   */
  messages?: PartialMessages<TimeRangePickerMessages> | undefined;

  /** The names of the two hidden inputs a plain form post reads. */
  startName?: string | undefined;
  endName?: string | undefined;

  /** The consumer's own shortcuts. The panel writes the run each one is. */
  presets?: readonly PickerPreset<TimeRange>[] | undefined;
  /**
   * Lengths the run can take from its start, in seconds. Defaults to fifteen
   * minutes through four hours.
   */
  durations?: readonly number[] | undefined;
  /** What the footer says when nothing is wrong. Unset, the limits, or the step. */
  footer?: ReactNode | undefined;
  /** What one whole time of `options` draws. The button around it is the clock's. */
  renderSlot?: ((state: ClockSlotState) => ReactNode) | undefined;

  render?: ((props: TimeRangePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<TimeRangePickerHandle> | undefined;
}
