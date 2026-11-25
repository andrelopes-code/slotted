import { inject, InjectionToken } from '@angular/core';
import { durationLabel } from '@slotted/core/date';
import type { DateTimeRangeValue, PlainDate, TimeGranularity } from '@slotted/core/date';

/** A run of datetimes, either end of which may be open. */
export type DateTimeRange = DateTimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type DateTimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type DateTimeRangePickerSize = 'sm' | 'md' | 'lg';
export type DateTimeRangePickerVariant = 'outline' | 'subtle' | 'plain';
export type DateTimeRangePickerHourCycle = 12 | 24;
export type DateTimeRangePickerCalendar = 'gregory';

/** The end being edited: the half and the clock carrying `data-current`. */
export type DateTimeRangePickerPosition = 'start' | 'end';

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const DATETIME_RANGE_PICKER_STEP = 900;
/** Two months: a run of moments crosses from one to the next more often than not. */
export const DATETIME_RANGE_PICKER_MONTHS = 2;

/** "3 days 21 hr": the duration the head says, in the family's locale. */
export function dateTimeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

export interface DateTimeRangePickerDefaults {
  calendar: DateTimeRangePickerCalendar;
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  firstDayOfWeek: number | undefined;
  granularity: TimeGranularity;
  hourCycle: DateTimeRangePickerHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  months: number;
  placement: DateTimeRangePickerPlacement;
  size: DateTimeRangePickerSize;
  step: number;
  timeZone: string | undefined;
  /** The day it is, stated by the application. Unset, the clock answers in `timeZone`. */
  today: PlainDate | undefined;
  variant: DateTimeRangePickerVariant;
}

const FALLBACK: DateTimeRangePickerDefaults = {
  calendar: 'gregory',
  confirm: true,
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: dateTimeRangePickerLengthLabel,
  months: DATETIME_RANGE_PICKER_MONTHS,
  placement: 'bottom-start',
  size: 'md',
  step: DATETIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  today: undefined,
  variant: 'outline',
};

export const DATETIME_RANGE_PICKER_DEFAULTS = new InjectionToken<DateTimeRangePickerDefaults>(
  'slotted datetime range picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its times look like, what step its clocks
 * offer and how a duration is written — rather than repeating the same inputs
 * on every picker in a form. The locale and the words come from the language
 * in force (`provideSlotted`).
 */
export function provideDateTimeRangePickerDefaults(defaults: Partial<DateTimeRangePickerDefaults>) {
  return {
    provide: DATETIME_RANGE_PICKER_DEFAULTS,
    useFactory: (): DateTimeRangePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a datetime range picker renders as here, before it states anything of its own. */
export function injectDateTimeRangePickerDefaults(): DateTimeRangePickerDefaults {
  return inject(DATETIME_RANGE_PICKER_DEFAULTS);
}
