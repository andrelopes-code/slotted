import { inject, InjectionToken } from '@angular/core';
import { durationLabel } from '@slotted/core/date';
import type { DateTimeRangeValue, PlainTime, TimeGranularity } from '@slotted/core/date';

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
export type DateTimeRangePickerHourCycle = 12 | 24;
export type DateTimeRangePickerCalendar = 'gregory';

/** The end being edited: the field and the panel carrying `data-current`. */
export type DateTimeRangePickerPosition = 'start' | 'end';

/** The highlighted option of each list. */
export interface DateTimeRangePickerHighlight {
  readonly start: PlainTime | null;
  readonly end: PlainTime | null;
}

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const DATETIME_RANGE_PICKER_STEP = 900;
/** A whole day at a one-minute step: the finest whole-day list any surveyed implementation offers. */
export const DATETIME_RANGE_PICKER_MAX_OPTIONS = 1440;
/** One month: two lists stand beside the grid, and two months beside two lists do not fit in 720 pixels. */
export const DATETIME_RANGE_PICKER_MONTHS = 1;

/** "3 days 21 hr": the duration the band and the rows say, in the family's locale. */
export function dateTimeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

export interface DateTimeRangePickerDefaults {
  calendar: DateTimeRangePickerCalendar;
  closeOnSelect: DateTimeRangePickerCloseOnSelect;
  firstDayOfWeek: number | undefined;
  granularity: TimeGranularity;
  hourCycle: DateTimeRangePickerHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  maxOptions: number;
  months: number;
  placement: DateTimeRangePickerPlacement;
  size: DateTimeRangePickerSize;
  step: number;
  timeZone: string | undefined;
  unavailableOptions: DateTimeRangePickerUnavailableOptions;
  variant: DateTimeRangePickerVariant;
}

const FALLBACK: DateTimeRangePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: dateTimeRangePickerLengthLabel,
  maxOptions: DATETIME_RANGE_PICKER_MAX_OPTIONS,
  months: DATETIME_RANGE_PICKER_MONTHS,
  placement: 'bottom-start',
  size: 'md',
  step: DATETIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

export const DATETIME_RANGE_PICKER_DEFAULTS = new InjectionToken<DateTimeRangePickerDefaults>(
  'slotted datetime range picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its times look like, what step its lists
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
