import type {
  DateTimeRangeValue,
  PlainDate,
  PlainDateTime,
  PlainTime,
  TimeGranularity,
  TimeOption,
} from '@slotted/core/date';
import type { DatetimeRangePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { DateTimeFieldHourCycle } from '../datetime-field';

/** A run of datetimes, either end of which may be open. */
export type DateTimeRange = DateTimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type DateTimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * Whether choosing closes the surface. `auto` closes when the work becomes
 * whole — by a press in a list, by `now` or by a preset — and stays open
 * while an end is still missing, because the next press has to reach the
 * same surface.
 */
export type DateTimeRangePickerCloseOnSelect = 'auto' | 'always' | 'never';

/** What a time a bound or the predicate refuses looks like in a list. */
export type DateTimeRangePickerUnavailableOptions = 'disable' | 'hide';

export type DateTimeRangePickerSize = 'sm' | 'md' | 'lg';
export type DateTimeRangePickerVariant = 'outline' | 'subtle' | 'plain';

/** The end being edited: the field and the panel carrying `data-current`. */
export type DateTimeRangePickerPosition = 'start' | 'end';

/** The highlighted option of each list. */
export interface DateTimeRangePickerHighlight {
  readonly start: PlainTime | null;
  readonly end: PlainTime | null;
}

export type DateTimeRangePickerValueReason = Extract<
  ChangeRequest<DateTimeRange | null>['reason'],
  'pointer' | 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic'
>;

/** What an application sets once for every datetime range picker under it. */
export type DateTimeRangePickerCalendar = 'gregory';

export interface DateTimeRangePickerDefaults {
  calendar: DateTimeRangePickerCalendar;
  closeOnSelect: DateTimeRangePickerCloseOnSelect;
  firstDayOfWeek: number | undefined;
  granularity: TimeGranularity;
  hourCycle: DateTimeFieldHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  /** How many rows a list may reach before it is cut. */
  maxOptions: number;
  /** How many months the grid shows; one, because two lists stand beside it. */
  months: number;
  placement: DateTimeRangePickerPlacement;
  size: DateTimeRangePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  unavailableOptions: DateTimeRangePickerUnavailableOptions;
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

/** What `renderOption` receives: the row's own state, and the time it holds. */
export interface DateTimeRangePickerOptionState {
  readonly position: DateTimeRangePickerPosition;
  /** The day this list serves: the date of its end, or the grid's focused day. */
  readonly date: PlainDate;
  readonly time: PlainTime;
  /** The whole time in the locale's shape, which is what the row draws. */
  readonly label: string;
  /** The duration the run would have with the other end as it stands, in words; `null` when the row carries none. */
  readonly duration: string | null;
  readonly selected: boolean;
  readonly current: boolean;
  readonly unavailable: boolean;
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

  /** Where the reader is in each list. Present means the consumer owns it. */
  highlighted?: DateTimeRangePickerHighlight | undefined;
  defaultHighlighted?: DateTimeRangePickerHighlight | undefined;
  onHighlightedChange?:
    | ((
        value: DateTimeRangePickerHighlight,
        request: ChangeRequest<DateTimeRangePickerHighlight>,
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
  /** Answers one time on one day and feeds the lists. */
  isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are refused in the grid, and on
   * the same day the times beyond the first unavailable one in the end list.
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
  /** How many rows a list may reach before it is cut. */
  maxOptions?: number | undefined;
  unavailableOptions?: DateTimeRangePickerUnavailableOptions | undefined;

  months?: number | undefined;
  weekNumbers?: boolean | undefined;
  /** Six rows whatever the month needs, so a press of "next" moves no target. On by default. */
  fixedWeeks?: boolean | undefined;

  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
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
  closeOnSelect?: DateTimeRangePickerCloseOnSelect | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws one clear on the frame, which empties both ends. */
  clearable?: boolean | undefined;
  /** Whether the two fields in the band take the relative expression. */
  relative?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's names, the two ends, the hint, the limit, and what a panel says
   * when it is empty or cut short.
   */
  messages?: PartialMessages<DatetimeRangePickerMessages> | undefined;

  /** The names of the two hidden inputs a plain form post reads. */
  startName?: string | undefined;
  endName?: string | undefined;

  /** The consumer's own shortcuts, as `DateTimeRangePickerPreset` elements. */
  presets?: ReactNode | undefined;
  /** The consumer's own actions, under the grid and the lists. */
  footer?: ReactNode | undefined;
  /** What one row draws. The row is the family's; what is in it is not. */
  renderOption?: ((state: DateTimeRangePickerOptionState) => ReactNode) | undefined;

  render?: ((props: DateTimeRangePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DateTimeRangePickerHandle> | undefined;
}

export interface DateTimeRangePickerPresetRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-selected'?: '' | undefined;
  disabled?: boolean | undefined;
  type: 'button';
  ref?: Ref<HTMLElement> | undefined;
}

export interface DateTimeRangePickerPresetProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'value' | 'ref'
> {
  /** The range the press writes, or a function resolving it at the press. */
  value: DateTimeRange | (() => DateTimeRange);
  render?: ((props: DateTimeRangePickerPresetRootProps) => ReactNode) | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
}

export type { TimeOption };
