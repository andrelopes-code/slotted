import { inject, InjectionToken } from '@angular/core';

export type { DateRange } from '@slotted/angular/calendar';

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

const FALLBACK: DateRangePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  count: 'days',
  months: 2,
  placement: 'bottom-start',
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

export const DATE_RANGE_PICKER_DEFAULTS = new InjectionToken<DateRangePickerDefaults>(
  'slotted date range picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what a run counts, which zone answers "today"
 * and how many months it shows — rather than repeating the same inputs on every
 * picker in a form. The locale that writes its dates and every word it says
 * come from the language in force (`provideSlotted`).
 */
export function provideDateRangePickerDefaults(defaults: Partial<DateRangePickerDefaults>) {
  return {
    provide: DATE_RANGE_PICKER_DEFAULTS,
    useFactory: (): DateRangePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a range picker renders as here, before it states anything of its own. */
export function injectDateRangePickerDefaults(): DateRangePickerDefaults {
  return inject(DATE_RANGE_PICKER_DEFAULTS);
}
