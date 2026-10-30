import { inject, InjectionToken } from '@angular/core';
import { durationLabel } from '@slotted/core/date';
import type { PlainTime, TimeGranularity, TimeRangeValue } from '@slotted/core/date';

/** A run of times, either end of which may be open. */
export type TimeRange = TimeRangeValue;

/** Where the surface opens, before the positioner has read the room. */
export type TimeRangePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * Whether choosing closes the surface. `auto` closes when the work becomes
 * whole — by a press in a list, by `now` or by a preset — and stays open
 * while an end is still missing, because the next press has to reach the
 * same surface.
 */
export type TimeRangePickerCloseOnSelect = 'auto' | 'always' | 'never';

/** What a time a bound or the predicate refuses looks like in a list. */
export type TimeRangePickerUnavailableOptions = 'disable' | 'hide';

export type TimeRangePickerSize = 'sm' | 'md' | 'lg';
export type TimeRangePickerVariant = 'outline' | 'subtle' | 'plain';
export type TimeRangePickerHourCycle = 12 | 24;

/** The end being edited: the field and the panel carrying `data-current`. */
export type TimeRangePickerPosition = 'start' | 'end';

/** The highlighted option of each list. */
export interface TimeRangePickerHighlight {
  readonly start: PlainTime | null;
  readonly end: PlainTime | null;
}

/** A quarter of an hour, the step every surveyed panel defaults to within a factor of two. */
export const TIME_RANGE_PICKER_STEP = 900;
/** A whole day at a one-minute step: the finest whole-day list any surveyed implementation offers. */
export const TIME_RANGE_PICKER_MAX_OPTIONS = 1440;

/** "2 hr 30 min": the duration the band and the rows say, in the family's locale. */
export function timeRangePickerLengthLabel(seconds: number, locale?: string): string {
  return durationLabel(seconds, locale);
}

export interface TimeRangePickerDefaults {
  closeOnSelect: TimeRangePickerCloseOnSelect;
  granularity: TimeGranularity;
  hourCycle: TimeRangePickerHourCycle | undefined;
  /** "2 hr 30 min", in the product's own words; seconds in, and the family's locale. */
  lengthLabel: (seconds: number, locale: string | undefined) => string;
  maxOptions: number;
  placement: TimeRangePickerPlacement;
  size: TimeRangePickerSize;
  step: number;
  timeZone: string | undefined;
  unavailableOptions: TimeRangePickerUnavailableOptions;
  variant: TimeRangePickerVariant;
}

const FALLBACK: TimeRangePickerDefaults = {
  closeOnSelect: 'auto',
  granularity: 'minute',
  hourCycle: undefined,
  lengthLabel: timeRangePickerLengthLabel,
  maxOptions: TIME_RANGE_PICKER_MAX_OPTIONS,
  placement: 'bottom-start',
  size: 'md',
  step: TIME_RANGE_PICKER_STEP,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

export const TIME_RANGE_PICKER_DEFAULTS = new InjectionToken<TimeRangePickerDefaults>(
  'slotted time range picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its times look like, what step its lists
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
