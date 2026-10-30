import type { PlainDate } from '@slotted/core/date';
import type { DateRangePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { DateRange } from '../calendar';

export type { DateRange } from '../calendar';

/** Where the surface opens, before the positioner has read the room. */
export type DateRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * Whether choosing closes the surface. `auto` closes when the run becomes
 * whole — by the second press, or by a preset — and stays open after the
 * first, because the second press has to reach the same surface.
 */
export type DateRangePickerCloseOnSelect = 'auto' | 'always' | 'never';

export type DateRangePickerSize = 'sm' | 'md' | 'lg';
export type DateRangePickerVariant = 'outline' | 'subtle' | 'plain';
export type DateRangePickerCalendar = 'gregory';

/**
 * What the length counts. A booking counts nights and a leave request counts
 * days, and the same pair of dates gives 4 or 5: the family names the unit
 * rather than choosing for the product. `days` counts both ends.
 */
export type DateRangePickerCount = 'days' | 'nights';

/** The end being edited: the field carrying `data-current`, and the end the next press in the grid writes. */
export type DateRangePickerPosition = 'start' | 'end';

export type DateRangePickerValueReason = Extract<
  ChangeRequest<DateRange | null>['reason'],
  'pointer' | 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic'
>;

/** What an application sets once for every range picker under it. */
export interface DateRangePickerDefaults {
  calendar: DateRangePickerCalendar;
  closeOnSelect: DateRangePickerCloseOnSelect;
  count: DateRangePickerCount;
  months: number;
  placement: DateRangePickerPlacement;
  size: DateRangePickerSize;
  timeZone: string | undefined;
  variant: DateRangePickerVariant;
}

export interface DateRangePickerDefaultsProviderProps extends Partial<DateRangePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface DateRangePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-calendar': DateRangePickerCalendar;
  'data-count': DateRangePickerCount;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateRangePickerSize;
  'data-ui': string;
  'data-variant': DateRangePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

export interface DateRangePickerHandle {
  /** Puts focus on the first segment of one end; the current end by default. */
  focus(position?: DateRangePickerPosition): void;
  open(): void;
  close(): void;
}

export interface DateRangePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: DateRange | null | undefined;
  defaultValue?: DateRange | null | undefined;
  onValueChange?:
    ((value: DateRange | null, request: ChangeRequest<DateRange | null>) => void) | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** Present means the consumer owns which end is being edited. */
  position?: DateRangePickerPosition | undefined;
  defaultPosition?: DateRangePickerPosition | undefined;
  onPositionChange?:
    | ((position: DateRangePickerPosition, request: ChangeRequest<DateRangePickerPosition>) => void)
    | undefined;

  min?: PlainDate | undefined;
  max?: PlainDate | undefined;
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  /**
   * Whether a run may cross an unavailable day. On, and with a start chosen,
   * the days beyond the first unavailable one are unavailable too, and a typed
   * run that crosses one is invalid; off, the run may jump over it and only
   * its two ends are checked.
   */
  contiguous?: boolean | undefined;
  /** The shortest and longest run allowed, in the unit `count` names. */
  minLength?: number | undefined;
  maxLength?: number | undefined;
  count?: DateRangePickerCount | undefined;

  months?: number | undefined;
  weekNumbers?: boolean | undefined;
  /** Six rows whatever the month needs, so a press of "next" moves no target. On by default. */
  fixedWeeks?: boolean | undefined;

  /** BCP 47. Writes both fields, the grid and the trigger's dates. Unset, the language in force decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  firstDayOfWeek?: number | undefined;
  yearPivot?: number | undefined;
  calendar?: DateRangePickerCalendar | undefined;

  size?: DateRangePickerSize | undefined;
  variant?: DateRangePickerVariant | undefined;
  placement?: DateRangePickerPlacement | undefined;
  closeOnSelect?: DateRangePickerCloseOnSelect | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  /** Draws one clear on the frame, which empties both ends. */
  clearable?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the clear, the names of the two ends, and the
   * phrases that count the run (`days.length`, `nights.between`, …).
   */
  messages?: PartialMessages<DateRangePickerMessages> | undefined;

  /** The names of the two hidden inputs a plain form post reads. */
  startName?: string | undefined;
  endName?: string | undefined;

  /** The consumer's own shortcuts, as `DateRangePicker.Preset` elements. */
  presets?: ReactNode | undefined;
  /** The consumer's own actions, under the calendar. */
  footer?: ReactNode | undefined;

  render?: ((props: DateRangePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DateRangePickerHandle> | undefined;
}

export interface DateRangePickerPresetRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-selected'?: '' | undefined;
  disabled?: boolean | undefined;
  type: 'button';
  ref?: Ref<HTMLElement> | undefined;
}

export interface DateRangePickerPresetProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'value' | 'ref'
> {
  /** The range the press writes, or a function resolving it at the press. */
  value: DateRange | (() => DateRange);
  render?: ((props: DateRangePickerPresetRootProps) => ReactNode) | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
}
