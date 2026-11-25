import { inject, InjectionToken } from '@angular/core';
import { durationLabel } from '@slotted/core/date';
import type { TimeGranularity, TimeRangeValue } from '@slotted/core/date';

/** A run of times, either end of which may be open. */
export type TimeRange = TimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type TimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type TimeRangePickerSize = 'sm' | 'md' | 'lg';
export type TimeRangePickerVariant = 'outline' | 'subtle' | 'plain';
export type TimeRangePickerHourCycle = 12 | 24;

/** The end being edited: the half and the clock carrying `data-current`. */
export type TimeRangePickerPosition = 'start' | 'end';

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const TIME_RANGE_PICKER_STEP = 900;

/** "2 hr 30 min": the duration the head says, in the family's locale. */
export function timeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

export interface TimeRangePickerDefaults {
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: TimeRangePickerHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  placement: TimeRangePickerPlacement;
  size: TimeRangePickerSize;
  step: number;
  timeZone: string | undefined;
  variant: TimeRangePickerVariant;
}

const FALLBACK: TimeRangePickerDefaults = {
  confirm: true,
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: timeRangePickerLengthLabel,
  placement: 'bottom-start',
  size: 'md',
  step: TIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  variant: 'outline',
};

export const TIME_RANGE_PICKER_DEFAULTS = new InjectionToken<TimeRangePickerDefaults>(
  'slotted time range picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its times look like, what step its clocks
 * offer and how a duration is written — rather than repeating the same inputs
 * on every picker in a form. The locale and the words come from the language
 * in force (`provideSlotted`).
 */
export function provideTimeRangePickerDefaults(defaults: Partial<TimeRangePickerDefaults>) {
  return {
    provide: TIME_RANGE_PICKER_DEFAULTS,
    useFactory: (): TimeRangePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a time range picker renders as here, before it states anything of its own. */
export function injectTimeRangePickerDefaults(): TimeRangePickerDefaults {
  return inject(TIME_RANGE_PICKER_DEFAULTS);
}
