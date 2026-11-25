import type {
  PickerPreset,
  PlainDate,
  PlainDateTime,
  PlainTime,
  TimeGranularity,
} from '@slotted/core/date';
import type { DatetimePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { ClockSlotState } from '../clock';
import type {
  DateTimeFieldHourCycle,
  DateTimeFieldSize,
  DateTimeFieldVariant,
} from '../datetime-field';

export type DateTimePickerSize = DateTimeFieldSize;
export type DateTimePickerVariant = DateTimeFieldVariant;
export type DateTimePickerHourCycle = DateTimeFieldHourCycle;

/** Where the panel hangs from the control. */
export type DateTimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/** What `renderSlot` is handed: one whole time, and the day it is a time of. */
export interface DateTimePickerSlotState extends ClockSlotState {
  /** The day in the draft, `null` before one is chosen. */
  readonly date: PlainDate | null;
}

/** What an application sets once for every datetime picker under it. */
export interface DateTimePickerDefaults {
  calendar: 'gregory';
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: DateTimePickerHourCycle | undefined;
  placement: DateTimePickerPlacement;
  size: DateTimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  variant: DateTimePickerVariant;
}

export interface DateTimePickerDefaultsProviderProps extends Partial<DateTimePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface DateTimePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateTimePickerSize;
  'data-ui': string;
  'data-variant': DateTimePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DateTimePickerHandle {
  focus(): void;
  open(): void;
  close(): void;
}

export interface DateTimePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  value?: PlainDateTime | null | undefined;
  defaultValue?: PlainDateTime | null | undefined;
  onValueChange?:
    | ((value: PlainDateTime | null, request: ChangeRequest<PlainDateTime | null>) => void)
    | undefined;

  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** The earliest whole value: where the range starts. */
  min?: PlainDateTime | undefined;
  /** The latest whole value: where the range ends. */
  max?: PlainDateTime | undefined;
  /** The earliest time of every day inside the range, beside `min`. */
  minTime?: PlainTime | undefined;
  /** The latest time of every day inside the range, beside `max`. */
  maxTime?: PlainTime | undefined;
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;

  /** Seconds between two offered times. The base is `min`'s time, or midnight. */
  step?: number | undefined;
  /**
   * The times the panel offers, stated rather than stepped.
   *
   * A step describes a regular list and a great many real ones are not: a
   * clinic open at 09:00, 09:20 and 13:45 cannot be written as a step, and a
   * predicate can only subtract from times that fall on one.
   */
  options?: readonly PlainTime[] | undefined;

  /** BCP 47. Writes the field, the grid, the list and the trigger's moment. Unset, the language in force decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  hourCycle?: DateTimePickerHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  calendar?: 'gregory' | undefined;
  firstDayOfWeek?: number | undefined;
  weekNumbers?: boolean | undefined;
  /**
   * The moment it is: what an empty field steps from, and what the panel counts
   * the distance and the steps from. Unset, the clock is read.
   */
  referenceDateTime?: PlainDateTime | undefined;

  size?: DateTimePickerSize | undefined;
  variant?: DateTimePickerVariant | undefined;
  placement?: DateTimePickerPlacement | undefined;
  /**
   * Whether the panel keeps a draft until Apply. `false` writes a whole moment
   * on every press, and closes on the one that completes it. Defaults to `true`.
   */
  confirm?: boolean | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  clearable?: boolean | undefined;

  /** Whether `+`, `-` and `=` open the duration expression in the field. */
  relative?: boolean | undefined;

  name?: string | undefined;

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, and what the panel says of a refused moment.
   */
  messages?: PartialMessages<DatetimePickerMessages> | undefined;

  /** The consumer's own shortcuts, after Now. */
  presets?: readonly PickerPreset<PlainDateTime>[] | undefined;
  /** Steps from now, in seconds. Defaults to an hour, four hours and a day. */
  offsets?: readonly number[] | undefined;
  /** What the footer says when nothing is wrong. Unset, the step. */
  footer?: ReactNode | undefined;
  /** What one whole time of `options` draws. The button around it is the clock's. */
  renderSlot?: ((state: DateTimePickerSlotState) => ReactNode) | undefined;

  render?: ((props: DateTimePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DateTimePickerHandle> | undefined;
}
