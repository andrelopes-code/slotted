import { inject, InjectionToken } from '@angular/core';

/** Where the surface opens, before the positioner has read the room. */
export type DatePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * Whether choosing a date closes the surface.
 *
 * `auto` closes for one date and stays open for a range or a set, which is the
 * only combination that is not a trap: a second press has to reach the same
 * surface.
 */
export type DatePickerCloseOnSelect = 'auto' | 'always' | 'never';

export type DatePickerSize = 'sm' | 'md' | 'lg';
export type DatePickerVariant = 'outline' | 'subtle' | 'plain';
export type DatePickerCalendar = 'gregory';

export interface DatePickerDefaults {
  calendar: DatePickerCalendar;
  closeOnSelect: DatePickerCloseOnSelect;
  placement: DatePickerPlacement;
  size: DatePickerSize;
  timeZone: string | undefined;
  variant: DatePickerVariant;
}

const FALLBACK: DatePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  placement: 'bottom-start',
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

export const DATE_PICKER_DEFAULTS = new InjectionToken<DatePickerDefaults>(
  'slotted date picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once which zone answers "today" and where its
 * surfaces open — rather than repeating the same inputs on every picker in a
 * form. The locale that writes its dates and the trigger's names come from the
 * language in force (`provideSlotted`).
 */
export function provideDatePickerDefaults(defaults: Partial<DatePickerDefaults>) {
  return {
    provide: DATE_PICKER_DEFAULTS,
    useFactory: (): DatePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a date picker renders as here, before it states anything of its own. */
export function injectDatePickerDefaults(): DatePickerDefaults {
  return inject(DATE_PICKER_DEFAULTS);
}
