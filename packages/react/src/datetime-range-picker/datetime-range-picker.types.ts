import type {
  DateTimeRangeValue,
  PickerPreset,
  PlainDate,
  PlainDateTime,
  PlainTime,
  TimeGranularity,
} from '@slotted/core/date';
import type { DatetimeRangePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { ClockSlotState } from '../clock';
import type { DateTimeFieldHourCycle } from '../datetime-field';

/** A run of datetimes, either end of which may be open. */
export type DateTimeRange = DateTimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type DateTimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type DateTimeRangePickerSize = 'sm' | 'md' | 'lg';
export type DateTimeRangePickerVariant = 'outline' | 'subtle' | 'plain';

/** The end being edited: the half and the clock carrying `data-current`. */
export type DateTimeRangePickerPosition = 'start' | 'end';

export type DateTimeRangePickerValueReason = Extract<
  ChangeRequest<DateTimeRange | null>['reason'],
  'pointer' | 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic'
>;

/** What an application sets once for every datetime range picker under it. */
export type DateTimeRangePickerCalendar = 'gregory';

export interface DateTimeRangePickerDefaults {
  calendar: DateTimeRangePickerCalendar;
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  firstDayOfWeek: number | undefined;
  granularity: TimeGranularity;
  hourCycle: DateTimeFieldHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  /** How many months the panel shows; one, in one column. */
  months: number;
  placement: DateTimeRangePickerPlacement;
  size: DateTimeRangePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  /** The day it is, stated by the application. Unset, the clock answers in `timeZone`. */
  today: PlainDate | undefined;
  variant: DateTimeRangePickerVariant;
}

export interface DateTimeRangePickerDefaultsProviderProps extends Partial<DateTimeRangePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface DateTimeRangePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-calendar': DateTimeRangePickerCalendar;
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateTimeRangePickerSize;
  'data-ui': string;
  'data-variant': DateTimeRangePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DateTimeRangePickerHandle {
  /** Puts focus on the trigger, which is the frame. */
  focus(): void;
  open(): void;
  close(): void;
}

/** What `renderSlot` is handed: one whole time, the end it is of, and that end's day. */
export interface DateTimeRangePickerSlotState extends ClockSlotState {
  /** The day of the end in the draft, `null` before one is chosen. */
  readonly date: PlainDate | null;
  readonly position: DateTimeRangePickerPosition;
}

export interface DateTimeRangePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: DateTimeRange | null | undefined;
  defaultValue?: DateTimeRange | null | undefined;
  onValueChange?:
    | ((value: DateTimeRange | null, request: ChangeRequest<DateTimeRange | null>) => void)
    | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** Present means the consumer owns which end is being edited. */
  position?: DateTimeRangePickerPosition | undefined;
  defaultPosition?: DateTimeRangePickerPosition | undefined;
  onPositionChange?:
    | ((
        position: DateTimeRangePickerPosition,
        request: ChangeRequest<DateTimeRangePickerPosition>,
      ) => void)
    | undefined;

  /** The whole-value bounds: where the range starts and ends. */
  min?: PlainDateTime | undefined;
  max?: PlainDateTime | undefined;
  /** The bounds of every day inside the range, applied together with the two above. */
  minTime?: PlainTime | undefined;
  maxTime?: PlainTime | undefined;
  /** Answers a whole day and feeds the grid. */
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  /** Answers one time on one day and feeds the clocks. */
  isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are refused in the grid, and on
   * the same day the times beyond the first unavailable one in the clock of the
   * end.
   */
  contiguous?: boolean | undefined;
  /** The shortest and longest run allowed, in seconds. */
  minLength?: number | undefined;
  maxLength?: number | undefined;
  lengthLabel?: DateTimeRangePickerDefaults['lengthLabel'] | undefined;

  /** Seconds between two offered times. Ignored when `options` states the list. */
  step?: number | undefined;
  /** The times to offer, stated rather than stepped; the same list for both ends. */
  options?: readonly PlainTime[] | undefined;

  months?: number | undefined;
  weekNumbers?: boolean | undefined;
  /** Six rows whatever the months need. Off: two months end where the longer one does. */
  fixedWeeks?: boolean | undefined;

  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. It decides the day marked as today, the date of
   * `referenceDateTime`, and the month an empty panel opens on. Unset, the
   * clock answers in `timeZone`.
   */
  today?: PlainDate | undefined;
  hourCycle?: DateTimeFieldHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  calendar?: DateTimeRangePickerCalendar | undefined;
  firstDayOfWeek?: number | undefined;
  yearPivot?: number | undefined;
  /** What "now" is, for a story or a test; the clock otherwise. */
  referenceDateTime?: PlainDateTime | undefined;

  size?: DateTimeRangePickerSize | undefined;
  variant?: DateTimeRangePickerVariant | undefined;
  placement?: DateTimeRangePickerPlacement | undefined;
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
  messages?: PartialMessages<DatetimeRangePickerMessages> | undefined;

  /** The names of the two hidden inputs a plain form post reads. */
  startName?: string | undefined;
  endName?: string | undefined;

  /** The consumer's own shortcuts. The panel writes the run each one is. */
  presets?: readonly PickerPreset<DateTimeRange>[] | undefined;
  /**
   * Lengths the run can take from its start, in seconds. Defaults to one day
   * through fourteen.
   */
  durations?: readonly number[] | undefined;
  /** What the footer says when nothing is wrong. Unset, the limits, the zone or the step. */
  footer?: ReactNode | undefined;
  /** What one whole time of `options` draws. The button around it is the clock's. */
  renderSlot?: ((state: DateTimeRangePickerSlotState) => ReactNode) | undefined;

  render?: ((props: DateTimeRangePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DateTimeRangePickerHandle> | undefined;
}
