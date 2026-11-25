import type { PlainDate, PlainYearMonth, PickerPreset } from '@slotted/core/date';
import type { DatePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { CalendarSelectionMode, CalendarValue, CalendarView } from '../calendar';

/** Where the surface opens, before the positioner has read the room. */
export type DatePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type DatePickerSize = 'sm' | 'md' | 'lg';
export type DatePickerVariant = 'outline' | 'subtle' | 'plain';
export type DatePickerCalendar = 'gregory';

/** What an application sets once for every date picker under it. */
export interface DatePickerDefaults {
  calendar: DatePickerCalendar;
  /** Whether the panel keeps a draft until Apply. Unset, only a run or a set does. */
  confirm: boolean | undefined;
  placement: DatePickerPlacement;
  size: DatePickerSize;
  timeZone: string | undefined;
  /** The day it is, stated by the application. Unset, the clock answers in `timeZone`. */
  today: PlainDate | undefined;
  variant: DatePickerVariant;
}

export interface DatePickerDefaultsProviderProps extends Partial<DatePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface DatePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-calendar': DatePickerCalendar;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DatePickerSize;
  'data-ui': string;
  'data-variant': DatePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DatePickerHandle {
  /** Puts focus on the first segment of the field. */
  focus(): void;
  open(): void;
  close(): void;
}

/** A date picker that chooses a day, a range of days or several days. */
export interface DatePickerDayProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** What a choice is. Defaults to `day`. */
  granularity?: 'day' | undefined;
  value?: CalendarValue | undefined;
  defaultValue?: CalendarValue | undefined;
  onValueChange?:
    ((value: CalendarValue, request: ChangeRequest<CalendarValue>) => void) | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  min?: PlainDate | undefined;
  max?: PlainDate | undefined;
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;

  selectionMode?: CalendarSelectionMode | undefined;
  months?: number | undefined;
  defaultView?: CalendarView | undefined;
  weekNumbers?: boolean | undefined;
  /**
   * Six rows whatever the month needs. On by default here and off in a bare
   * calendar: a surface that grows a row between one press of "next" and the
   * next moves the target the reader was aiming at.
   */
  fixedWeeks?: boolean | undefined;

  /** BCP 47. Writes the field, the grid and the trigger's date. Unset, the language in force decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  /**
   * The day it is, stated by the application: a business date, a day a server
   * answers. It decides the day marked as today, the built-in Today, the
   * distance the head writes and the month an empty panel opens on. Unset, the
   * clock answers in `timeZone`.
   */
  today?: PlainDate | undefined;
  firstDayOfWeek?: number | undefined;
  yearPivot?: number | undefined;
  calendar?: DatePickerCalendar | undefined;

  size?: DatePickerSize | undefined;
  variant?: DatePickerVariant | undefined;
  placement?: DatePickerPlacement | undefined;
  /**
   * Whether the panel keeps a draft until Apply. Off for one date or one
   * month, which a press finishes; on for a run and for a set.
   */
  confirm?: boolean | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  clearable?: boolean | undefined;
  name?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's name before (`choose`) and after (`change`) a date is chosen,
   * and what the panel says of a refused one.
   */
  messages?: PartialMessages<DatePickerMessages> | undefined;

  /** The consumer's own shortcuts. The panel writes what each one is. */
  presets?: readonly PickerPreset<CalendarValue>[] | undefined;
  /** What the footer says when nothing is wrong. */
  footer?: ReactNode | undefined;

  render?: ((props: DatePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DatePickerHandle> | undefined;
}

/**
 * A date picker that chooses a month of a year: a card statement, a budget
 * month. The calendar opens on the months of the year, the field shows the
 * month and the year segments, and `name` submits `YYYY-MM`. The bounds are
 * months; a day-based predicate, several months and a range do not apply.
 */
export interface DatePickerMonthProps extends Omit<
  DatePickerDayProps,
  | 'defaultValue'
  | 'defaultView'
  | 'firstDayOfWeek'
  | 'fixedWeeks'
  | 'granularity'
  | 'isDateUnavailable'
  | 'max'
  | 'min'
  | 'months'
  | 'onValueChange'
  | 'presets'
  | 'selectionMode'
  | 'value'
  | 'weekNumbers'
> {
  granularity: 'month';
  value?: PlainYearMonth | null | undefined;
  defaultValue?: PlainYearMonth | null | undefined;
  onValueChange?:
    | ((value: PlainYearMonth | null, request: ChangeRequest<PlainYearMonth | null>) => void)
    | undefined;
  min?: PlainYearMonth | undefined;
  max?: PlainYearMonth | undefined;
  presets?: readonly PickerPreset<PlainYearMonth>[] | undefined;
}

export type DatePickerProps = DatePickerDayProps | DatePickerMonthProps;
